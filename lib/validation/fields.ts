/**
 * Input rules for every fan-app field and URL parameter — one place, so forms, URLs and the API agree.
 *
 *  - `clean.*`  run on every keystroke/paste: drop characters the field can never contain.
 *  - `check.*`  run before submit: return a user-facing error message, or null when valid.
 *  - `url.*`    parse route/query params: return a safe value or null (never trust the address bar).
 *
 * Server-side mirrors: zexy_api/app/core/validators.py (keep the patterns in sync).
 */

export const LIMITS = {
  name: { min: 2, max: 50 },
  username: { min: 3, max: 30 },
  place: { min: 2, max: 50 }, // city / state / country
  search: { max: 50 },
  message: { max: 1000 },
  note: { max: 500 },
  tip: { min: 1, max: 100_000 }, // ₹
  age: { min: 18, max: 100 },
  utrDigits: 12,
  mobileDigits: 10,
  codeDigits: 4, // OTP / PIN
} as const;

const PATTERNS = {
  /** Letters, single spaces between words. */
  name: /^[A-Za-z]+(?: [A-Za-z]+)*$/,
  /** lowercase letters, digits, ".", "_", "-"; starts/ends with a letter or digit; no doubled separators.
   *  Same rule as the API (stored lowercase) and the creator app. */
  username: /^(?!.*[._-]{2})[a-z0-9][a-z0-9._-]*[a-z0-9]$/,
  /** Indian mobile: 10 digits starting 6–9. */
  mobile: /^[6-9]\d{9}$/,
  /** Place names: letters, with single space / dot / hyphen between parts ("Navi Mumbai", "St. Thomas"). */
  place: /^[A-Za-z]+(?:[ .-]{1,2}[A-Za-z]+)*\.?$/,
  code: /^\d{4}$/,
  utr: /^\d{12}$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
} as const;

const collapseSpaces = (v: string) => v.replace(/\s+/g, ' ').replace(/^ /, '');

/** First value of a route param, URI-decoded; malformed escapes (e.g. "%E0%A4") give '' instead of throwing. */
function param(raw: unknown): string {
  const v = String(Array.isArray(raw) ? raw[0] : raw ?? '');
  try {
    return decodeURIComponent(v).trim();
  } catch {
    return '';
  }
}

/** Keystroke/paste filters. They never reject — they strip what can't belong and cap the length. */
export const clean = {
  digits: (v: string, max: number) => v.replace(/\D/g, '').slice(0, max),
  /** Accepts pasted "+91 98765 43210" / "098765 43210" and keeps the 10-digit number. */
  mobile: (v: string) => {
    let d = v.replace(/\D/g, '');
    if (d.length > 10 && d.startsWith('91')) d = d.slice(2);
    if (d.length > 10 && d.startsWith('0')) d = d.slice(1);
    return d.slice(0, LIMITS.mobileDigits);
  },
  name: (v: string) => collapseSpaces(v.replace(/[^A-Za-z ]/g, '')).slice(0, LIMITS.name.max),
  username: (v: string) =>
    v.toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9._-]/g, '').replace(/([._-])[._-]+/g, '$1').slice(0, LIMITS.username.max),
  place: (v: string) =>
    collapseSpaces(v.replace(/[^A-Za-z .-]/g, '')).replace(/([.-]){2,}/g, '$1').slice(0, LIMITS.place.max),
  /** Search boxes: letters, digits, spaces and the few symbols handles/names use. */
  search: (v: string) => collapseSpaces(v.replace(/[^A-Za-z0-9 ._@'-]/g, '')).slice(0, LIMITS.search.max),
  /** Free text (chat, notes): strip control chars, cap length; content itself is free-form. */
  text: (v: string, max: number = LIMITS.message.max) =>
    v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max),
  code: (v: string) => v.replace(/\D/g, '').slice(0, 1), // one OTP/PIN box
  amount: (v: string) => v.replace(/\D/g, '').replace(/^0+/, '').slice(0, String(LIMITS.tip.max).length),
  utr: (v: string) => v.replace(/\D/g, '').slice(0, LIMITS.utrDigits),
};

/** Submit-time checks. Each returns an error message or null. */
export const check = {
  name(v: string, label = 'Name'): string | null {
    const s = v.trim();
    if (!s) return `${label} is required`;
    if (s.length < LIMITS.name.min) return `${label} must be at least ${LIMITS.name.min} letters`;
    if (s.length > LIMITS.name.max) return `${label} must be at most ${LIMITS.name.max} characters`;
    if (!PATTERNS.name.test(s)) return `${label} can contain only letters and spaces`;
    return null;
  },
  username(v: string): string | null {
    const s = v.trim().replace(/^@+/, '');
    if (!s) return 'Username is required';
    if (s.length < LIMITS.username.min || s.length > LIMITS.username.max)
      return `Username must be ${LIMITS.username.min}–${LIMITS.username.max} characters`;
    if (!PATTERNS.username.test(s))
      return 'Username can use lowercase letters, numbers, ".", "_" and "-", and must start and end with a letter or number';
    return null;
  },
  mobile(v: string): string | null {
    const s = v.trim();
    if (!s) return 'Mobile number is required';
    if (!/^\d+$/.test(s)) return 'Mobile number can contain only digits';
    if (s.length !== LIMITS.mobileDigits) return 'Mobile number must be exactly 10 digits';
    if (!/^[6-9]/.test(s)) return 'Mobile number must start with 6, 7, 8 or 9';
    return null;
  },
  place(v: string, label = 'City', required = true): string | null {
    const s = v.trim();
    if (!s) return required ? `${label} is required` : null;
    if (s.length < LIMITS.place.min) return `${label} must be at least ${LIMITS.place.min} letters`;
    if (s.length > LIMITS.place.max) return `${label} must be at most ${LIMITS.place.max} characters`;
    if (!PATTERNS.place.test(s)) return `${label} can contain only letters, spaces, "." and "-"`;
    return null;
  },
  dob(v: string, today: Date = new Date()): string | null {
    if (!v) return 'Date of birth is required';
    if (!PATTERNS.date.test(v)) return 'Enter a valid date of birth';
    const [y, m, day] = v.split('-').map(Number);
    const d = new Date(y, m - 1, day);
    // Rejects impossible dates like 2001-02-30 (JS would roll them into March).
    if (d.getFullYear() !== y || d.getMonth() !== m - 1 || d.getDate() !== day) return 'Enter a valid date of birth';
    if (d > today) return 'Date of birth cannot be in the future';
    const age = ageOn(v, today);
    if (age < LIMITS.age.min) return `You must be at least ${LIMITS.age.min} years old`;
    if (age > LIMITS.age.max) return 'Enter a valid date of birth';
    return null;
  },
  code(v: string, label = 'Code'): string | null {
    return PATTERNS.code.test(v) ? null : `Enter the 4-digit ${label}`;
  },
  message(v: string, max: number = LIMITS.message.max): string | null {
    const s = v.trim();
    if (!s) return 'Message cannot be empty';
    if (s.length > max) return `Message must be at most ${max} characters`;
    return null;
  },
  tip(n: number): string | null {
    if (!Number.isInteger(n)) return 'Enter a whole rupee amount';
    if (n < LIMITS.tip.min) return `Minimum tip is ₹${LIMITS.tip.min}`;
    if (n > LIMITS.tip.max) return `Maximum tip is ₹${LIMITS.tip.max.toLocaleString('en-IN')}`;
    return null;
  },
  utr(v: string): string | null {
    return PATTERNS.utr.test(v) ? null : 'UTR must be exactly 12 digits';
  },
};

/** Whole years between `iso` (YYYY-MM-DD) and `today`. */
function ageOn(iso: string, today: Date = new Date()): number {
  const [y, m, d] = iso.split('-').map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age;
}

/** <input type="date"> bounds: oldest allowed and youngest allowed (min age) birthdays. */
export function dobBounds(today: Date = new Date()): { min: string; max: string } {
  const iso = (dt: Date) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const max = new Date(today); max.setFullYear(today.getFullYear() - LIMITS.age.min);
  const min = new Date(today); min.setFullYear(today.getFullYear() - LIMITS.age.max);
  return { min: iso(min), max: iso(max) };
}

/** URL/route parameter parsing. Anything malformed becomes null so pages show "not found" instead of calling the API with junk. */
export const url = {
  /** Positive integer id ("42"). Rejects "42abc", "-1", "1e3", "0". */
  id(raw: unknown): number | null {
    const s = Array.isArray(raw) ? raw[0] : raw;
    if (typeof s !== 'string' || !/^[1-9]\d{0,9}$/.test(s)) return null;
    return Number(s);
  },
  /** Numeric id or app user code (ZX-CR-0042 / ZX-0042). */
  userRef(raw: unknown): string | null {
    const s = param(raw);
    return /^[1-9]\d{0,9}$/.test(s) || /^ZX-(?:[A-Z]{2}-)?\d{1,10}$/i.test(s) ? s : null;
  },
  username(raw: unknown): string | null {
    const s = param(raw).replace(/^@+/, '').toLowerCase();
    return s.length >= LIMITS.username.min && s.length <= LIMITS.username.max && PATTERNS.username.test(s) ? s : null;
  },
  /** Category slug: lowercase words joined by "-" or "_". */
  slug(raw: unknown): string | null {
    const s = String(Array.isArray(raw) ? raw[0] : raw ?? '').trim().toLowerCase();
    return /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(s) && s.length <= 50 ? s : null;
  },
  /** Live room id: letters, digits, "-" and "_". */
  roomId(raw: unknown): string | null {
    const s = String(Array.isArray(raw) ? raw[0] : raw ?? '').trim();
    return /^[A-Za-z0-9_-]{1,100}$/.test(s) ? s : null;
  },
  /** Gateway order / payment references. */
  reference(raw: string | null | undefined): string | null {
    const s = (raw ?? '').trim();
    return /^[A-Za-z0-9_-]{1,100}$/.test(s) ? s : null;
  },
  /** Same-site path for post-login / post-payment redirects; blocks open redirects ("//evil", "https://", "/\\evil"). */
  internalPath(raw: string | null | undefined): string | null {
    const s = (raw ?? '').trim();
    if (!s.startsWith('/') || s.startsWith('//') || s.startsWith('/\\') || /[\u0000-\u001F]/.test(s)) return null;
    try {
      const parsed = new URL(s, 'http://zexy.local');
      return parsed.origin === 'http://zexy.local' ? parsed.pathname + parsed.search + parsed.hash : null;
    } catch {
      return null;
    }
  },
  /** Integer amount in paise from a query string, within sane bounds. */
  paise(raw: string | null | undefined): number | null {
    const s = (raw ?? '').trim();
    if (!/^\d{1,9}$/.test(s)) return null;
    const n = Number(s);
    return n > 0 && n <= LIMITS.tip.max * 100 ? n : null;
  },
  mobile(raw: string | null | undefined): string {
    const s = clean.mobile(raw ?? '');
    return PATTERNS.mobile.test(s) ? s : '';
  },
};
