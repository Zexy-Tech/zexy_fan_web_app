import { getMediaUrl } from '@/lib/utils';

export function subscriptionAvatarSrc(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/sample-media/') || path.startsWith('/sample-products/')) return path;
  return getMediaUrl(path);
}

/** % of current billing period still remaining (100 = full time left, 0 = expired). */
export function membershipDaysLeftPercent(startedAt: string, expiresAt: string): number {
  const t0 = new Date(startedAt).getTime();
  const t1 = new Date(expiresAt).getTime();
  const now = Date.now();
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) return 0;
  const totalMs = t1 - t0;
  const remainingMs = t1 - now;
  const raw = (remainingMs / totalMs) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function daysLeftLabel(expiresAt: string): string {
  const t1 = new Date(expiresAt).getTime();
  const now = Date.now();
  if (!Number.isFinite(t1)) return '';
  const d = Math.ceil((t1 - now) / 86400000);
  if (d <= 0) return 'Expired';
  if (d === 1) return '1 day left';
  return `${d} days left`;
}

/** e.g. `14 - May - 2026` */
export function formatSubscriptionDetailDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const day = d.getDate();
  const month = d.toLocaleString('en-IN', { month: 'long' });
  const year = d.getFullYear();
  return `${day} - ${month} - ${year}`;
}
