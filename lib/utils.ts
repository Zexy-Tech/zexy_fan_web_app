import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.zexy.live').replace(/\/+$/, '');

  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      const url = new URL(path);
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        const cleanPath = url.pathname.startsWith('/') ? url.pathname : `/${url.pathname}`;
        return `${baseUrl}${cleanPath}${url.search}${url.hash}`;
      }
      return path;
    } catch {
      return path;
    }
  }

  // Ensure we don't have double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
