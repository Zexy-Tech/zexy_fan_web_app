/** Return 10-digit Indian mobile (no country code) or null if not usable for OTP. */
export function normalizeToIndianMobileTen(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return d.slice(2);
  if (d.length === 10 && /^[6-9]/.test(d)) return d;
  if (d.length > 10 && /^[6-9]/.test(d.slice(-10))) return d.slice(-10);
  return null;
}

export function isValidIndianMobileTen(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits);
}
