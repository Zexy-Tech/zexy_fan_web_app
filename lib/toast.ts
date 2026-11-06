/**
 * The app's only toast API (Sonner underneath). Import `toast` from here, not from 'sonner'.
 *
 * Every toast closes on its own: 3 s for short messages, 5 s for longer ones (a caller can still pass
 * `duration`). Sonner pauses its timer while it thinks the pointer is over a toast; on phones a tap
 * (e.g. the one that triggers the browser's notification prompt) can leave that pause stuck forever,
 * so each toast is also force-dismissed when its time is up.
 */
import { toast as sonner, type ExternalToast } from 'sonner';

type Message = Parameters<typeof sonner>[0];

const SHORT_MS = 3000;
const LONG_MS = 5000;
const LONG_TEXT = 60; // characters (message + description) before a toast counts as long

function text(v: unknown): string {
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
}

export function toastDuration(message: Message, data?: ExternalToast): number {
  if (data?.duration !== undefined) return data.duration;
  return text(message).length + text(data?.description).length > LONG_TEXT ? LONG_MS : SHORT_MS;
}

function autoClose(show: (message: Message, data?: ExternalToast) => string | number) {
  return (message: Message, data?: ExternalToast) => {
    const duration = toastDuration(message, data);
    const id = show(message, { ...data, duration });
    if (Number.isFinite(duration)) setTimeout(() => sonner.dismiss(id), duration);
    return id;
  };
}

export const toast = Object.assign(autoClose(sonner), {
  success: autoClose(sonner.success),
  error: autoClose(sonner.error),
  info: autoClose(sonner.info),
  warning: autoClose(sonner.warning),
  message: autoClose(sonner.message),
  dismiss: sonner.dismiss,
});
