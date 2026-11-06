import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isCreatorMemberForFan } from '@/lib/creatorMembership';
import { daysLeftLabel, membershipDaysLeftPercent } from '@/lib/subscriptionUi';
import type { ActiveSubscription } from '@/services/subscriptions';

const NOW = new Date('2026-11-06T12:00:00Z');
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
afterEach(() => vi.useRealTimers());

const sub = (over: Partial<ActiveSubscription>): ActiveSubscription =>
  ({ status: 'active', expires_at: '2026-12-01T00:00:00Z', creator_uid: 5, creator_username: 'Ritu.Bakes', ...over }) as ActiveSubscription;

describe('isCreatorMemberForFan', () => {
  const creator = { id: 5, username: 'ritu.bakes', is_subscribed: false };
  it('requires login', () => {
    expect(isCreatorMemberForFan({ isAuthenticated: false, creator: { ...creator, is_subscribed: true }, mySubscriptions: [] })).toBe(false);
  });
  it('trusts the API flag, else matches an active, unexpired subscription by username (any case) or id', () => {
    expect(isCreatorMemberForFan({ isAuthenticated: true, creator: { ...creator, is_subscribed: true }, mySubscriptions: [] })).toBe(true);
    expect(isCreatorMemberForFan({ isAuthenticated: true, creator, mySubscriptions: [sub({})] })).toBe(true);
    expect(isCreatorMemberForFan({ isAuthenticated: true, creator, mySubscriptions: [sub({ creator_username: 'x', creator_uid: 5 })] })).toBe(true);
    expect(isCreatorMemberForFan({ isAuthenticated: true, creator, mySubscriptions: [sub({ expires_at: '2026-11-01T00:00:00Z' })] })).toBe(false);
    expect(isCreatorMemberForFan({ isAuthenticated: true, creator, mySubscriptions: [sub({ status: 'cancelled' })] })).toBe(false);
  });
});

describe('subscription progress', () => {
  it('percent left is clamped and handles bad input', () => {
    expect(membershipDaysLeftPercent('2026-11-01T12:00:00Z', '2026-11-11T12:00:00Z')).toBe(50);
    expect(membershipDaysLeftPercent('2026-10-01T00:00:00Z', '2026-10-31T00:00:00Z')).toBe(0);
    expect(membershipDaysLeftPercent('bad', '2026-12-01')).toBe(0);
  });
  it('days-left label', () => {
    expect(daysLeftLabel('2026-11-07T12:00:00Z')).toBe('1 day left');
    expect(daysLeftLabel('2026-11-16T12:00:00Z')).toBe('10 days left');
    expect(daysLeftLabel('2026-11-01T00:00:00Z')).toBe('Expired');
  });
});
