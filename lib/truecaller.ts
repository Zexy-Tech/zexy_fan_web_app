import { ENV } from '@/constants/env';

export interface TruecallerVerificationOptions {
  loginPrefix?: 'logIn' | 'signUp';
  privacyUrl?: string;
  termsUrl?: string;
  onAppOpened?: () => void;
  onAppNotFound?: () => void;
}

export interface TruecallerSessionState {
  nonce: string;
  timestamp: number;
}

const STORAGE_KEY = 'tc_pending_nonce';

/**
 * Generate cryptographically random request nonce (8 to 64 chars)
 */
export function generateTruecallerNonce(): string {
  const rand = Math.random().toString(36).substring(2, 14);
  const time = Date.now().toString(36);
  return `tc_${time}_${rand}`;
}

/**
 * Save pending nonce in sessionStorage for correlation
 */
export function storePendingTruecallerNonce(nonce: string): void {
  if (typeof window === 'undefined') return;
  const state: TruecallerSessionState = {
    nonce,
    timestamp: Date.now(),
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Retrieve saved pending nonce
 */
export function getPendingTruecallerNonce(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed: TruecallerSessionState = JSON.parse(raw);
    // Expire nonces older than 10 minutes
    if (Date.now() - parsed.timestamp > 10 * 60 * 1000) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.nonce;
  } catch {
    return null;
  }
}

/**
 * Clear pending nonce
 */
export function clearPendingTruecallerNonce(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if the browser is running on Android
 */
export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

/**
 * Check if the browser is running on any mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Construct the Truecaller Web Deep Link URI
 */
export function buildTruecallerDeepLink(nonce: string, options?: Partial<TruecallerVerificationOptions>): string {
  const partnerKey = ENV.TRUECALLER_PARTNER_KEY;
  const partnerName = ENV.TRUECALLER_APP_NAME || 'Zexy';
  const privacyUrl = options?.privacyUrl || (typeof window !== 'undefined' ? `${window.location.origin}/privacy` : 'https://zexy.live/privacy-policy');
  const termsUrl = options?.termsUrl || (typeof window !== 'undefined' ? `${window.location.origin}/terms` : 'https://zexy.live/terms-of-service');
  const loginPrefix = options?.loginPrefix || 'logIn';

  const params = new URLSearchParams({
    type: 'btmsheet',
    requestNonce: nonce,
    partnerKey: partnerKey,
    partnerName: partnerName,
    lang: 'en',
    privacyUrl: privacyUrl,
    termsUrl: termsUrl,
    loginPrefix: loginPrefix,
    ctaColor: '#8c3df1',
    ctaTextColor: '#ffffff',
    skipOption: 'skipOption',
  });

  return `truecallersdk://truesdk/web_verify?${params.toString()}`;
}

const UNAVAILABLE_STORAGE_KEY = 'tc_app_unavailable';

/**
 * Check if Truecaller 1-Tap is supported and available on this device.
 * Truecaller 1-Tap deep link only works on Android mobile devices with Truecaller installed.
 */
export function isTruecallerSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // In development / testing, allow forced display if query param ?tc_dev=1 is present
  if (window.location.search.includes('tc_dev=1')) {
    return true;
  }

  // Must have Truecaller Partner Key configured
  if (!ENV.TRUECALLER_PARTNER_KEY) return false;

  // Check if previously flagged as not installed or unavailable in this session
  try {
    if (sessionStorage.getItem(UNAVAILABLE_STORAGE_KEY) === 'true') {
      return false;
    }
    // Clean up any stale legacy localStorage block
    if (localStorage.getItem(UNAVAILABLE_STORAGE_KEY)) {
      localStorage.removeItem(UNAVAILABLE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }

  // Truecaller 1-Tap native bottom sheet is only supported on Android mobile devices
  // On iOS (iPhone/iPad) and Desktop, Truecaller 1-tap deep link does not exist
  return isAndroidDevice();
}

/**
 * Mark Truecaller as unavailable on this device (e.g. app not installed)
 */
export function markTruecallerUnavailable(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(UNAVAILABLE_STORAGE_KEY, 'true');
  } catch {
    // Ignore storage errors
  }
}

/**
 * Clear unavailable flag
 */
export function clearTruecallerUnavailable(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(UNAVAILABLE_STORAGE_KEY);
    localStorage.removeItem(UNAVAILABLE_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

/**
 * Trigger Truecaller 1-Tap verification on supported mobile devices
 */
export function triggerTruecallerVerification(
  options: TruecallerVerificationOptions = {}
): { nonce: string; deepLink: string } {
  const nonce = generateTruecallerNonce();
  storePendingTruecallerNonce(nonce);

  const deepLink = buildTruecallerDeepLink(nonce, options);

  // Set timeout to check if the Truecaller application handled the deep link
  setTimeout(() => {
    // If the document still has focus after 1500ms, the deep link failed (app likely not installed)
    if (document.hasFocus()) {
      markTruecallerUnavailable();
      options.onAppNotFound?.();
    } else {
      options.onAppOpened?.();
    }
  }, 1500);

  // Trigger deep link
  window.location.href = deepLink;

  return { nonce, deepLink };
}

