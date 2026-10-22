# Mobile Browser Push Notifications & In-App Notification System

## Overview

Zexy implements mobile browser push notifications using **Firebase Cloud Messaging (FCM) Web Push** for Android, iOS (16.4+ standalone PWA), and desktop browsers, integrated seamlessly with the FastAPI backend (`zexy_api`) and MySQL database (`zexy_db`).

---

## 1. Firebase Console Manual Configuration

To enable Web Push tokens in production and development:

1. Open the [Firebase Console](https://console.firebase.google.com/) and navigate to the `zexy-dev` project (or production project).
2. Go to **Project Settings** (gear icon) -> **Cloud Messaging** tab.
3. Scroll down to **Web configuration** -> **Web Push certificates**.
4. If no key pair exists, click **Generate key pair**.
5. Copy the generated public key (VAPID Key) and add it to `.env.local`:
   ```bash
   NEXT_PUBLIC_FIREBASE_VAPID_KEY=BN...your_vapid_key_pair...
   ```
6. In **Service accounts**, ensure that the server environment for `zexy_api` has access to the Firebase Admin credentials via either:
   - `GOOGLE_APPLICATION_CREDENTIALS=/path/to/firebase-service-account.json`
   - Or Firebase Admin initialized via environment variables/Workload Identity.

---

## 2. Architecture & Components

```
┌────────────────────────────────────────────────────────┐
│                   Next.js Fan Web App                  │
├───────────────────────┬────────────────────────────────┤
│ /firebase-messaging-  │ lib/firebase-messaging.ts      │
│ sw.js (Compat v10.13) │ - isSupported() SSR guard      │
│ - onBackgroundMessage │ - getFCMRegistrationToken()    │
│ - notificationclick   │ - onForegroundMessageListener()│
├───────────────────────┼────────────────────────────────┤
│ components/           │ pages:                         │
│ - NotificationBell    │ - /notifications (History)     │
│ - NotificationCenter  │ - /settings (Preferences & PWA)│
│                       │ - /admin/notifications (Bcast) │
└───────────▲──────────────────────────▲─────────────────┘
            │                          │
            │ JWT Bearer               │ FCM Push
            ▼                          │
┌──────────────────────────────────────┴─────────────────┐
│                    FastAPI Backend                     │
├────────────────────────────────────────────────────────┤
│ - POST /api/v1/common/notifications/devices            │
│ - GET  /api/v1/fan/notifications                       │
│ - POST /api/v1/admin/notifications                     │
│ - ExternalNotificationService + FCMService             │
└───────────────────────────▲────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                        Database                        │
│ - device_registrations (multi-device FCM tokens)       │
│ - notifications (in-app history & action_url)          │
│ - notification_preferences (6 category toggles)        │
│ - bulk_notifications (admin broadcast tracking)        │
└────────────────────────────────────────────────────────┘
```

---

## 3. iOS Safari Web Push Setup (iOS 16.4+)

Apple requires Web Push on iOS to run in standalone Progressive Web App (PWA) mode:

1. User visits `https://fan.zexy.live` in **Safari**.
2. Tap the **Share** button (box with upward arrow).
3. Tap **Add to Home Screen**.
4. Open Zexy from the home screen icon.
5. In **Settings -> Notifications**, tap **Enable Push Notifications**.
6. When prompted, tap **Allow**.

The app automatically detects iOS and standalone status:
- If running in normal Safari, the app displays a prominent **"iOS Web Push Setup Required"** instruction card guiding the user to "Add to Home Screen".
- When running in standalone mode, standard Web Push permission and FCM token generation are unlocked.

---

## 4. Multi-Device & Token Lifecycle Management

- **Multi-Device Support:** Fans can register multiple devices (e.g., Android phone, iPad, Mac Chrome, Windows PC). Each device is recorded in `device_registrations` with platform, browser, device label, and `is_active=1`.
- **Token Rotation & Refresh:** When a token is refreshed or renewed, `register_device` automatically updates the existing record without creating duplicates.
- **Automatic Stale Token Invalidation:** If Firebase returns `messaging.UnregisteredError` (`FCM_004`), the backend immediately deactivates the corresponding token in `device_registrations`, preventing wasted API calls.
- **Unregistering Devices:** Users can view all active devices under **Settings -> Registered Devices** and revoke any device with a single click.

---

## 5. Granular User Preferences

Fans can toggle specific notification categories in **Settings**:
- **Creator Live Alerts (`live_alerts_enabled`):** Broadcasts when followed creators start streaming.
- **New Content Drops (`content_updates_enabled`):** Posts, media, and feed drops.
- **Chat Messages (`chat_notifications_enabled`):** Direct 1-on-1 replies and creator messages.
- **Subscriptions & Renewals (`subscription_reminders_enabled`):** Billing confirmation and renewal alerts.
- **Platform Announcements (`announcements_enabled`):** Admin announcements and feature news.

---

## 6. Admin Broadcast Console

Authorized administrators (`user.role === 'admin'`) can access `/admin/notifications`:
- **Audience Filtering:** All eligible fans or targeted user IDs.
- **Action URLs:** Deep links (e.g. `/creators`, `/creator/alice`, `/content/42`).
- **Live Lock Screen Simulation:** Preview card simulating mobile notification appearance before broadcast.
- **Confirmation Guard:** Explicit modal confirming recipient count before queueing.
- **Delivery Stats:** Tracks total targeted, delivered, and failed notifications in real-time.

---

## 7. Verification & Testing

- **Backend tests:** Run `pytest tests/test_admin_notifications.py tests/test_mobile_push_and_fan_notifications.py` (45 tests passed).
- **Frontend build:** Run `npm run build` in `zexy_fan_web_app` (passed with 0 errors).
