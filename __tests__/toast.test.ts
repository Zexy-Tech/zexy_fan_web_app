import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sonner = vi.hoisted(() => {
  const fn = vi.fn(() => 'id-1') as unknown as Record<string, unknown> & ((...a: unknown[]) => string);
  for (const k of ['success', 'error', 'info', 'warning', 'message']) fn[k] = vi.fn(() => `id-${k}`);
  fn.dismiss = vi.fn();
  return fn;
});
vi.mock('sonner', () => ({ toast: sonner }));

import { toast } from '@/lib/toast';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('toast auto-close', () => {
  it('short messages close after 3s', () => {
    toast.success('Saved');
    expect(sonner.success).toHaveBeenCalledWith('Saved', { duration: 3000 });
    vi.advanceTimersByTime(2999);
    expect(sonner.dismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(sonner.dismiss).toHaveBeenCalledWith('id-success');
  });
  it('long messages (with description) close after 5s', () => {
    toast.error('Could not save', { description: 'The server did not respond in time, please try again later.' });
    expect(sonner.error).toHaveBeenCalledWith('Could not save', expect.objectContaining({ duration: 5000 }));
    vi.advanceTimersByTime(5000);
    expect(sonner.dismiss).toHaveBeenCalledWith('id-error');
  });
  it('an explicit duration wins; Infinity is never force-dismissed', () => {
    toast.info('Sticky', { duration: Infinity });
    vi.advanceTimersByTime(60_000);
    expect(sonner.dismiss).not.toHaveBeenCalled();
  });
});
