import { describe, expect, it } from 'vitest';
import { buildAndroidUpiIntentUrl, buildUpiPayQueryString, buildUpiUrl } from '@/constants/payment';

const q = (u: string) => new URLSearchParams(u.slice(u.indexOf('?') + 1));

describe('buildUpiUrl', () => {
  it('formats rupees with two decimals, never paise', () => {
    expect(q(buildUpiUrl({ amount: 1, payeeVpa: 'z@upi', payeeName: 'Zexy', transactionRef: 'order_abc123' })).get('am')).toBe('1.00');
    expect(q(buildUpiUrl({ amount: '149.5', payeeVpa: 'z@upi', payeeName: 'Zexy', transactionRef: 'order_abc123' })).get('am')).toBe('149.50');
    expect(q(buildUpiUrl({ amount: 'abc', payeeVpa: 'z@upi', payeeName: 'Zexy', transactionRef: 'order_abc123' })).get('am')).toBe('0.00');
  });
  it('keeps payee, currency and caps the note at 50 chars', () => {
    const p = q(buildUpiUrl({ amount: 10, payeeVpa: 'zexy@ybl', payeeName: 'Zexy Live', transactionNote: 'x'.repeat(80), transactionRef: 'order_abc123' }));
    expect(p.get('pa')).toBe('zexy@ybl');
    expect(p.get('pn')).toBe('Zexy Live');
    expect(p.get('cu')).toBe('INR');
    expect(p.get('tn')!.length).toBeLessThanOrEqual(50); // the personal-account ref suffix used to push it to 51
    expect(p.get('tn')).toMatch(/ ref:\w+$/);
  });
  it('query string and android intent wrap the same parameters', () => {
    const qs = buildUpiPayQueryString({ amount: 5, payeeVpa: 'z@upi', payeeName: 'Z', transactionRef: 'order_abc123' });
    expect(qs).toContain('am=5.00');
    expect(buildAndroidUpiIntentUrl(qs, 'com.phonepe.app')).toBe(`intent://pay?${qs}#Intent;scheme=upi;package=com.phonepe.app;end`);
  });
});
