const USER_CODE_STORAGE_KEY = 'zexy_user_codes';

/**
 * Deterministically generates a standardized user code from a numeric user ID and optional role.
 * Creator: ZX-CR-0001
 * Fan:     ZX-FN-0001
 * Default: ZX-US-0001
 */
export function toUserCode(
  id: number | string | null | undefined,
  role?: 'creator' | 'fan' | 'admin' | string | null
): string {
  if (id === null || id === undefined || id === '' || id === 0) {
    return '';
  }

  const strId = String(id).trim();
  // If already formatted as a user code, keep it
  if (/^ZX-[A-Z]{2}-\d+$/i.test(strId) || /^ZX-\d+$/i.test(strId)) {
    return strId.toUpperCase();
  }

  const num = parseInt(strId, 10);
  if (isNaN(num)) {
    return strId;
  }

  const normalizedRole = role?.toLowerCase();
  const prefix =
    normalizedRole === 'creator'
      ? 'ZX-CR-'
      : normalizedRole === 'fan'
        ? 'ZX-FN-'
        : normalizedRole === 'admin'
          ? 'ZX-AD-'
          : 'ZX-US-';

  const padded = String(Math.abs(num)).padStart(4, '0');
  return `${prefix}${padded}`;
}

/**
 * Extracts the numeric ID from a user code or numeric string.
 * e.g., 'ZX-CR-0042' -> 42, 'ZX-FN-0001' -> 1, '42' -> 42
 */
export function fromUserCode(code: string | number | null | undefined): number | null {
  if (code === null || code === undefined || code === '') {
    return null;
  }
  if (typeof code === 'number') {
    return Number.isFinite(code) ? code : null;
  }

  const str = String(code).trim();
  const match = str.match(/(\d+)$/);
  if (match) {
    const val = parseInt(match[1], 10);
    return isNaN(val) ? null : val;
  }
  return null;
}

/**
 * Formats user identification for UI display, preferring username, then user code, never raw ID.
 */
export function formatUserDisplay(user: {
  username?: string | null;
  user_code?: string | null;
  id?: number | string | null;
  user_id?: number | string | null;
  role?: string | null;
  name?: string | null;
}): string {
  if (user.username && user.username.trim() !== '') {
    return user.username.startsWith('@') ? user.username : `@${user.username}`;
  }
  if (user.name && user.name.trim() !== '') {
    return user.name;
  }
  if (user.user_code && user.user_code.trim() !== '') {
    return user.user_code;
  }
  const id = user.id ?? user.user_id;
  if (id) {
    return toUserCode(id, user.role);
  }
  return 'User';
}

/**
 * Persists user code in local storage (localStorage) mapping userId -> userCode.
 */
export function saveUserCodeToStorage(userId: number, code: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existingRaw = localStorage.getItem(USER_CODE_STORAGE_KEY);
    const map: Record<string, string> = existingRaw ? JSON.parse(existingRaw) : {};
    map[String(userId)] = code;
    localStorage.setItem(USER_CODE_STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('[userCode] Failed to cache user code locally:', err);
  }
}

/**
 * Retrieves cached user code from local storage.
 */
export function getUserCodeFromStorage(userId: number): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existingRaw = localStorage.getItem(USER_CODE_STORAGE_KEY);
    if (!existingRaw) return null;
    const map: Record<string, string> = JSON.parse(existingRaw);
    return map[String(userId)] || null;
  } catch {
    return null;
  }
}
