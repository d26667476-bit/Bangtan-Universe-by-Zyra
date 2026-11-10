importScripts(new URL("firebase-config.js", self.location.href).href);
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

firebase.initializeApp(self.BTS_FIREBASE_CONFIG);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title = payload.data?.title || "BTS Universe update";
    const url = new URL(
        (payload.data?.url || "/dashboard.html").replace(/^\/+/, ""),
        self.registration.scope
    );

    self.registration.showNotification(title, {
        body: payload.data?.body || "New content has been published.",
        icon: new URL("assets/bts%20group%20photo.jpg", self.registration.scope).href,
        data: { url: url.href }
    });
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = new URL(event.notification.data?.url || "dashboard.html", self.registration.scope);
    if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) {
        return;
    }

    event.waitUntil(self.clients.openWindow(url.href));
});
