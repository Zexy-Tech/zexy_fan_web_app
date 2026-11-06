

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

