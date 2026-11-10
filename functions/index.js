const { createHash, timingSafeEqual } = require("node:crypto");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const { defineSecret } = require("firebase-functions/params");
const { HttpsError, onCall, onRequest } = require("firebase-functions/v2/https");

initializeApp();

const db = getFirestore();
const notificationWebhookSecret = defineSecret("NOTIFICATION_WEBHOOK_SECRET");
const tokenCollection = db.collection("notificationTokens");

function tokenDocumentId(token) {
    return createHash("sha256").update(token).digest("hex");
}

function validateToken(token) {
    if (typeof token !== "string" || token.length < 20 || token.length > 4096) {
        throw new HttpsError("invalid-argument", "A valid Firebase notification token is required.");
    }
}

exports.registerNotificationToken = onCall({ enforceAppCheck: true }, async (request) => {
    const token = request.data?.token;
    validateToken(token);
    await tokenCollection.doc(tokenDocumentId(token)).set({
        token,
        updatedAt: FieldValue.serverTimestamp()
    });
    return { registered: true };
});

exports.removeNotificationToken = onCall({ enforceAppCheck: true }, async (request) => {
    const token = request.data?.token;
    validateToken(token);
    await tokenCollection.doc(tokenDocumentId(token)).delete();
    return { removed: true };
});

function hasValidAuthorization(header, expectedSecret) {
    if (typeof header !== "string" || !header.startsWith("Bearer ")) {
        return false;
    }
    const provided = Buffer.from(header.slice(7));
    const expected = Buffer.from(expectedSecret);
    return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function validateNotification(data) {
    if (!data || typeof data.title !== "string" || typeof data.body !== "string" ||
        typeof data.url !== "string" || data.title.length > 100 || data.body.length > 300) {
        return false;
    }
    if (!data.url.startsWith("/") || data.url.startsWith("//")) {
        return false;
    }
    return new URL(data.url, "https://bts-universe.invalid").origin === "https://bts-universe.invalid";
}

exports.sendSiteUpdate = onRequest(
    { secrets: [notificationWebhookSecret] },
    async (request, response) => {
        if (request.method !== "POST") {
            response.set("Allow", "POST").status(405).send("Method not allowed.");
            return;
        }
        if (!hasValidAuthorization(request.get("authorization"), notificationWebhookSecret.value())) {
            response.status(401).send("Unauthorized.");
            return;
        }
        if (!validateNotification(request.body)) {
            response.status(400).send("Invalid notification payload.");
            return;
        }

        try {
            const snapshots = await tokenCollection.select("token").get();
            const tokens = snapshots.docs.map((document) => document.get("token")).filter(Boolean);
            let sent = 0;

            for (let index = 0; index < tokens.length; index += 500) {
                const batch = tokens.slice(index, index + 500);
                const result = await getMessaging().sendEachForMulticast({
                    tokens: batch,
                    data: {
                        title: request.body.title,
                        body: request.body.body,
                        url: request.body.url
                    },
                    webpush: { headers: { TTL: "86400" } }
                });
                sent += result.successCount;

                const removals = [];
                result.responses.forEach((item, itemIndex) => {
                    if (!item.success && [
                        "messaging/invalid-registration-token",
                        "messaging/registration-token-not-registered"
                    ].includes(item.error?.code)) {
                        removals.push(tokenCollection.doc(tokenDocumentId(batch[itemIndex])).delete());
                    }
                });
                await Promise.all(removals);
            }

            response.status(200).json({ sent });
        } catch (error) {
            console.error("Failed to send website update notifications:", error);
            response.status(500).send("Could not send website update notifications.");
        }
    }
);
