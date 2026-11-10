import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app-check.js";
import { deleteToken, getMessaging, getToken, isSupported, onMessage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-functions.js";

const bell = document.querySelector("#notification-bell");
const panel = document.querySelector("#notification-panel");
const status = document.querySelector("#notification-status");
const enableButton = document.querySelector("#enable-notifications");
const disableButton = document.querySelector("#disable-notifications");
const dot = document.querySelector("#notification-dot");
const config = globalThis.BTS_FIREBASE_CONFIG;

if (bell && panel && status && enableButton && disableButton && dot) {
    let messaging;
    let registerToken;
    let removeToken;

    const setStatus = (message) => {
        status.textContent = message;
    };

    const setSubscribed = (subscribed) => {
        enableButton.hidden = subscribed;
        disableButton.hidden = !subscribed;
        dot.hidden = !subscribed;
        bell.setAttribute("aria-label", subscribed ? "Notification settings; notifications are enabled" : "Open notification settings");
    };

    const isConfigured = () => {
        const requiredValues = [
            config?.apiKey,
            config?.projectId,
            config?.messagingSenderId,
            config?.appId,
            config?.appCheckSiteKey,
            config?.vapidKey
        ];
        return requiredValues.every((value) => value && !value.startsWith("YOUR_"));
    };

    const initializeNotifications = async () => {
        if (!isConfigured()) {
            throw new Error("The site owner still needs to finish the Firebase notification setup.");
        }
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            throw new Error("This browser does not support web push notifications.");
        }
        if (!(await isSupported())) {
            throw new Error("Web push notifications are not supported in this browser.");
        }

        const app = initializeApp(config);
        initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(config.appCheckSiteKey),
            isTokenAutoRefreshEnabled: true
        });
        messaging = getMessaging(app);

        const functions = getFunctions(app, "us-central1");
        registerToken = httpsCallable(functions, "registerNotificationToken");
        removeToken = httpsCallable(functions, "removeNotificationToken");

        onMessage(messaging, (payload) => {
            const title = payload.data?.title || "BTS Universe update";
            const message = payload.data?.body || "New content has been published.";
            setStatus(`${title}: ${message}`);
            if (Notification.permission === "granted") {
                new Notification(title, { body: message, icon: "/assets/bts%20group%20photo.jpg" });
            }
        });
    };

    bell.addEventListener("click", () => {
        const isOpen = bell.getAttribute("aria-expanded") === "true";
        bell.setAttribute("aria-expanded", String(!isOpen));
        panel.hidden = isOpen;
    });

    enableButton.addEventListener("click", async () => {
        enableButton.disabled = true;
        setStatus("Setting up notifications…");
        try {
            await initializeNotifications();
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                throw new Error(permission === "denied"
                    ? "Notifications are blocked in your browser settings."
                    : "Notification permission was not granted.");
            }

            const serviceWorkerRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
            const token = await getToken(messaging, {
                vapidKey: config.vapidKey,
                serviceWorkerRegistration
            });
            if (!token) {
                throw new Error("Firebase did not return a notification subscription. Please try again.");
            }

            await registerToken({ token });
            setSubscribed(true);
            setStatus("You’re subscribed. We’ll let you know when website sections are updated.");
        } catch (error) {
            console.error("Could not enable website notifications:", error);
            setStatus(error instanceof Error ? error.message : "Could not enable notifications. Please try again.");
        } finally {
            enableButton.disabled = false;
        }
    });

    disableButton.addEventListener("click", async () => {
        disableButton.disabled = true;
        setStatus("Turning off notifications…");
        try {
            if (!messaging) {
                await initializeNotifications();
            }
            const token = await getToken(messaging, { vapidKey: config.vapidKey });
            if (token) {
                await removeToken({ token });
                await deleteToken(messaging);
            }
            setSubscribed(false);
            setStatus("Notifications are turned off for this browser.");
        } catch (error) {
            console.error("Could not disable website notifications:", error);
            setStatus(error instanceof Error ? error.message : "Could not turn off notifications. Please try again.");
        } finally {
            disableButton.disabled = false;
        }
    });

    if (!isConfigured()) {
        setStatus("Notifications will be available after the site owner completes Firebase setup.");
    }
}
