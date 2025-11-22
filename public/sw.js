// Service Worker for Push Notifications
// Save this as: public/sw.js

console.log("Service Worker loaded");

// Listen for push notifications
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  let notificationData;

  try {
    // Try to parse the push data
    if (event.data) {
      notificationData = event.data.json();
      console.log("Notification data:", notificationData);
    } else {
      console.error("No data in push event");
      notificationData = {
        title: "New Notification",
        body: "You have a new notification",
        icon: "/icon-192x192.png",
        data: { url: "/" },
      };
    }
  } catch (err) {
    console.error("Error parsing push data:", err);
    notificationData = {
      title: "New Notification",
      body: "You have a new notification",
      icon: "/icon-192x192.png",
      data: { url: "/" },
    };
  }

  // Show the notification
  const promiseChain = self.registration.showNotification(
    notificationData.title || "New Notification",
    {
      body:
        notificationData.body ||
        notificationData.message ||
        "New content available",
      icon: notificationData.icon || "/icon-192x192.png",
      badge: notificationData.badge || "/badge-72x72.png",
      data: notificationData.data || { url: "/" },
      tag: notificationData.tag || "default",
      requireInteraction: false,
      vibrate: [200, 100, 200],
    }
  );

  event.waitUntil(promiseChain);
});

// Listen for notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("Notification clicked:", event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  // Open or focus the app
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Service Worker installation
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  self.skipWaiting();
});

// Service Worker activation
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(clients.claim());
});

// Handle push subscription changes
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("Push subscription changed");
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription.options)
      .then((subscription) => {
        console.log("Resubscribed:", subscription);
        // You might want to send this new subscription to your server
        return fetch("/api/notifications/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
      })
  );
});
