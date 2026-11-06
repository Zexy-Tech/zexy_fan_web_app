import { describe, expect, it } from 'vitest';
import { check, clean, dobBounds, url } from '@/lib/validation/fields';

describe('check', () => {
  it('username: format and length, case and leading @ handled like the API', () => {
    expect(check.username('ritu.bakes')).toBeNull();
    expect(check.username('@ritu_bakes-1')).toBeNull();
    expect(check.username('ab')).toMatch(/3–30/);
    expect(check.username('a'.repeat(31))).toMatch(/3–30/);
    expect(check.username('Ritu')).toMatch(/lowercase/);
    expect(check.username('ritu..bakes')).toMatch(/lowercase/);
    expect(check.username('.ritu')).toMatch(/lowercase/);
    expect(check.username('')).toBe('Username is required');
  });

  it('mobile: 10 digits starting 6-9', () => {
    expect(check.mobile('9876543210')).toBeNull();
    expect(check.mobile('5876543210')).toMatch(/start with 6/);
    expect(check.mobile('98765')).toMatch(/exactly 10/);
    expect(check.mobile('98765abcde')).toMatch(/only digits/);
  });

  it('dob: rejects impossible dates, the future and under-18s', () => {
    const today = new Date(2026, 10, 6);
    expect(check.dob('2000-02-30', today)).toBe('Enter a valid date of birth');
    expect(check.dob('2027-01-01', today)).toMatch(/future/);
    expect(check.dob('2010-01-01', today)).toMatch(/at least 18/);
    expect(check.dob('2008-11-06', today)).toBeNull(); // 18 today
    expect(check.dob('2008-11-07', today)).toMatch(/at least 18/); // 18 tomorrow
  });

  it('tip and utr bounds', () => {
    expect(check.tip(0)).toMatch(/Minimum/);
    expect(check.tip(1.5)).toMatch(/whole/);
    expect(check.tip(100_001)).toMatch(/Maximum/);
    expect(check.tip(50)).toBeNull();
    expect(check.utr('123456789012')).toBeNull();
    expect(check.utr('12345')).toMatch(/12 digits/);
  });
});

describe('clean', () => {
  it('mobile keeps the 10-digit number from pasted formats', () => {
    expect(clean.mobile('+91 98765 43210')).toBe('9876543210');
    expect(clean.mobile('098765 43210')).toBe('9876543210');
  });
  it('username lowercases, strips @ and collapses separators', () => {
    expect(clean.username('@Ritu..Bakes!!')).toBe('ritu.bakes');
  });
  it('text strips control characters', () => {
    expect(clean.text('hi\u0000there\u0007')).toBe('hithere');
  });
});

describe('url', () => {
  it('id accepts only positive integers', () => {
    expect(url.id('42')).toBe(42);
    for (const bad of ['0', '-1', '42abc', '1e3', undefined]) expect(url.id(bad)).toBeNull();
  });
  it('internalPath blocks open redirects', () => {
    expect(url.internalPath('/creators?x=1#a')).toBe('/creators?x=1#a');
    for (const bad of ['//evil.com', 'https://evil.com', '/\\evil.com', 'creators']) expect(url.internalPath(bad)).toBeNull();
  });
  it('userRef accepts ids and app user codes', () => {
    expect(url.userRef('ZX-CR-0042')).toBe('ZX-CR-0042');
    expect(url.userRef('17')).toBe('17');
    expect(url.userRef('%E0%A4')).toBeNull();
  });
});

it('dobBounds matches the 18–100 age window', () => {
  expect(dobBounds(new Date(2026, 10, 6))).toEqual({ min: '1926-11-06', max: '2008-11-06' });
});
