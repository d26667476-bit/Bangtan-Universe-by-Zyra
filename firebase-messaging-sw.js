importScripts("/firebase-config.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

firebase.initializeApp(self.BTS_FIREBASE_CONFIG);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title = payload.data?.title || "BTS Universe update";
    const url = payload.data?.url || "/dashboard.html";

    self.registration.showNotification(title, {
        body: payload.data?.body || "New content has been published.",
        icon: "/assets/bts%20group%20photo.jpg",
        data: { url }
    });
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = new URL(event.notification.data?.url || "/dashboard.html", self.location.origin);
    if (url.origin !== self.location.origin) {
        return;
    }

    event.waitUntil(self.clients.openWindow(url.href));
});
