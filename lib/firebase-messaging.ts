import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';
import { getFirebaseApp } from '@/lib/firebase';

let messagingInstance: Messaging | null = null;
let messagingSupportedPromise: Promise<boolean> | null = null;

/**
 * Checks if Firebase Messaging and the browser Push API are supported.
 * SSR-safe: returns false when running on the server.
 */
export async function isFirebaseMessagingSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }
  if (!messagingSupportedPromise) {
    messagingSupportedPromise = isSupported().catch((err) => {
      console.warn('[Firebase Messaging] isSupported() check failed:', err);
      return false;
    });
  }
  return messagingSupportedPromise;
}

/**
 * Environment check for iOS and standalone PWA mode.
 * iOS Safari requires iOS 16.4+ and "Add to Home Screen" (standalone PWA mode) to enable Web Push.
 */
export function getPushSupportDetails(): {
  isSupported: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  needsHomeScreenAdd: boolean;
} {
  if (typeof window === 'undefined') {
    return { isSupported: false, isIOS: false, isStandalone: false, needsHomeScreenAdd: false };
  }

  const userAgent = window.navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const isStandalone =
    (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches;

  const basicPushSupport = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  const needsHomeScreenAdd = isIOS && !isStandalone;

  return {
    isSupported: basicPushSupport || (isIOS && isStandalone),
    isIOS,
    isStandalone,
    needsHomeScreenAdd,
  };
}

/**
 * Detect client device information for registration metadata.
 */
export function detectClientDeviceMetadata(): {
  platform: string;
  browser: string;
  device_label: string;
} {
  if (typeof window === 'undefined') {
    return { platform: 'unknown', browser: 'unknown', device_label: 'Web Client' };
  }

  const ua = window.navigator.userAgent;
  let platform = 'other';
  if (/Android/i.test(ua)) platform = 'android';
  else if (/iPhone|iPad|iPod/i.test(ua)) platform = 'ios';
  else if (/Macintosh|Mac OS X/i.test(ua)) platform = 'macos';
  else if (/Windows/i.test(ua)) platform = 'windows';
  else if (/Linux/i.test(ua)) platform = 'linux';

  let browser = 'other';
  if (/Edg\//i.test(ua)) browser = 'edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = 'chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'safari';
  else if (/Firefox\//i.test(ua)) browser = 'firefox';
  else if (/OPR|Opera/i.test(ua)) browser = 'opera';

  const readableBrowser = browser.charAt(0).toUpperCase() + browser.slice(1);
  const readablePlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
  const device_label = `${readableBrowser} on ${readablePlatform}`;

  return { platform, browser, device_label };
}

/**
 * Safely registers the Firebase Messaging Service Worker at `/firebase-messaging-sw.js`.
 */
export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/',
    });
    return registration;
  } catch (error) {
    console.error('[Firebase Messaging] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Gets or initializes the Firebase Messaging instance safely.
 */
export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') return null;

  const supported = await isFirebaseMessagingSupported();
  if (!supported) return null;

  if (messagingInstance) return messagingInstance;

  const app = getFirebaseApp();
  if (!app) return null;

  try {
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.warn('[Firebase Messaging] getMessaging error:', error);
    return null;
  }
}

/**
 * Requests browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.warn('[Firebase Messaging] requestPermission error:', error);
    return Notification.permission;
  }
}

/**
 * Obtains an FCM Web Push registration token.
 */
export async function getFCMRegistrationToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const messaging = await getFirebaseMessaging();
  if (!messaging) {
    console.warn('[Firebase Messaging] Messaging not supported on this platform');
    return null;
  }

  const swRegistration = await registerMessagingServiceWorker();
  if (!swRegistration) {
    console.warn('[Firebase Messaging] No service worker registration found');
    return null;
  }

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  try {
    const token = await getToken(messaging, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn('[Firebase Messaging] No registration token returned');
      return null;
    }

    return token;
  } catch (error) {
    console.error('[Firebase Messaging] Error obtaining FCM token:', error);
    return null;
  }
}

/**
 * Subscribes to foreground push notifications.
 * When the app is in the foreground, Firebase triggers this callback instead of a system notification.
 */
export async function onForegroundMessageListener(
  callback: (payload: MessagePayload) => void
): Promise<(() => void) | null> {
  const messaging = await getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      callback(payload);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('[Firebase Messaging] onMessage registration error:', err);
    return null;
  }
}
