/* eslint-disable no-undef */
// Firebase Messaging Service Worker for Zexy Fan Web App
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Public Firebase client configuration for Web Push
const firebaseConfig = {
  apiKey: 'AIzaSyCTmTaDAfYUU_ALZRp8Px0HDCD8KaEY2d4',
  authDomain: 'zexy-dev.firebaseapp.com',
  projectId: 'zexy-dev',
  storageBucket: 'zexy-dev.firebasestorage.app',
  messagingSenderId: '292392470573',
  appId: '1:292392470573:web:de0a09aa42288aec4690a4',
};

// Initialize Firebase compat app inside Service Worker
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

// Immediately activate service worker
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    'Zexy Notification';

  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      payload.data?.message ||
      '',
    icon: payload.notification?.icon || payload.data?.icon || '/zexy_z_letter_logo_nobg.png',
    badge: payload.notification?.badge || payload.data?.badge || '/zexy_z_letter_logo_nobg.png',
    image: payload.notification?.image || payload.data?.image || undefined,
    data: {
      action_url:
        payload.fcmOptions?.link ||
        payload.data?.action_url ||
        payload.data?.click_action ||
        '/',
      ...payload.data,
    },
    tag: payload.data?.tag || `zexy-${Date.now()}`,
    renotify: true,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to navigate to the target deep link or focus an existing window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl =
    event.notification.data?.action_url ||
    event.notification.data?.click_action ||
    '/';

  const resolvedUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there is already a window open with this app
        for (const client of windowClients) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            // Navigate existing window to target deep link and focus it
            if ('navigate' in client) {
              return client.navigate(resolvedUrl).then((navigatedClient) => {
                return (navigatedClient || client).focus();
              });
            }
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(resolvedUrl);
        }
      })
  );
});
