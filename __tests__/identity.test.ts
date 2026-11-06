import { describe, expect, it } from 'vitest';
import { isValidIndianMobileTen, normalizeToIndianMobileTen } from '@/lib/indianMobile';
import { fromUserCode, toUserCode } from '@/lib/userCode';

describe('indian mobile', () => {
  it('normalizes common formats', () => {
    expect(normalizeToIndianMobileTen('+91 98765-43210')).toBe('9876543210');
    expect(normalizeToIndianMobileTen('919876543210')).toBe('9876543210');
    expect(normalizeToIndianMobileTen('12345')).toBeNull();
    expect(normalizeToIndianMobileTen(null)).toBeNull();
    expect(isValidIndianMobileTen('6000000000')).toBe(true);
    expect(isValidIndianMobileTen('5000000000')).toBe(false);
  });
});

describe('user codes', () => {
  it('formats by role and round-trips', () => {
    expect(toUserCode(42, 'creator')).toBe('ZX-CR-0042');
    expect(toUserCode(7, 'fan')).toBe('ZX-FN-0007');
    expect(toUserCode(12345)).toBe('ZX-US-12345');
    expect(toUserCode('zx-cr-0042')).toBe('ZX-CR-0042');
    expect(toUserCode(0)).toBe('');
    expect(fromUserCode('ZX-CR-0042')).toBe(42);
    expect(fromUserCode(toUserCode(99, 'fan'))).toBe(99);
    expect(fromUserCode('abc')).toBeNull();
  });
});
