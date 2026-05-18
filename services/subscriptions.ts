import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface SubscriptionPlan {
  id: number;
  creator_uid: number;
  name: string;
  price: number;
  duration_days: number;
  description: string | null;
  is_active: boolean;
}

export interface ActiveSubscription {
  id: number;
  fan_uid: number;
  creator_uid: number;
  creator_username: string;
  creator_name: string;
  /** Creator profile image path or URL when provided by API */
  creator_avatar?: string | null;
  /** Monthly price in INR for display when API does not send plan price */
  monthly_amount?: number | null;
  subscription_id: number;
  plan_name: string;
  status: 'active' | 'expired' | 'cancelled';
  started_at: string;
  expires_at: string;
  /** Payment / ledger reference when provided by API */
  transaction_code?: string | null;
  /** Posted content counts for list UI (optional from API). */
  image_count?: number;
  video_count?: number;
  audio_count?: number;
  product_count?: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 1,
    creator_uid: 1,
    name: 'Monthly Access',
    price: 299,
    duration_days: 30,
    description: 'Full access to all exclusive content for 30 days',
    is_active: true,
  },
  {
    id: 2,
    creator_uid: 1,
    name: 'Quarterly Access',
    price: 799,
    duration_days: 90,
    description: 'Save 10% with quarterly subscription',
    is_active: true,
  },
];

/** Sample membership plans when the API returns none (creator profile upsell / preview). */
export function getDemoCreatorMembershipPlans(creatorUid: number): SubscriptionPlan[] {
  return MOCK_PLANS.map((p, i) => ({
    ...p,
    id: creatorUid * 100 + i + 1,
    creator_uid: creatorUid,
  }));
}

const MOCK_ACTIVE_SUBSCRIPTIONS: ActiveSubscription[] = [
  {
    id: 1,
    fan_uid: 1,
    creator_uid: 2,
    creator_username: 'vikasfitzone',
    creator_name: 'Vikas Mehra',
    creator_avatar: '/sample-media/tom.png',
    monthly_amount: 299,
    subscription_id: 3,
    plan_name: 'Monthly Access',
    status: 'active',
    started_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 20).toISOString(),
    transaction_code: 'TXN-ZEXY-2026-10001',
    image_count: 24,
    video_count: 8,
    audio_count: 5,
    product_count: 3,
  },
  {
    id: 2,
    fan_uid: 1,
    creator_uid: 3,
    creator_username: 'amar',
    creator_name: 'Amar',
    creator_avatar: '/sample-media/id-card-1.png',
    monthly_amount: 499,
    subscription_id: 4,
    plan_name: 'Pro Monthly',
    status: 'active',
    started_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 25).toISOString(),
    transaction_code: 'TXN-ZEXY-2026-10002',
    image_count: 42,
    video_count: 12,
    audio_count: 9,
    product_count: 6,
  },
  {
    id: 3,
    fan_uid: 1,
    creator_uid: 4,
    creator_username: 'priyasharma',
    creator_name: 'Priya Sharma',
    creator_avatar: '/sample-media/id-card-2.png',
    monthly_amount: 399,
    subscription_id: 5,
    plan_name: 'Standard',
    status: 'active',
    started_at: new Date(Date.now() - 86400000 * 22).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 8).toISOString(),
    transaction_code: 'TXN-ZEXY-2026-10003',
    image_count: 18,
    video_count: 6,
    audio_count: 4,
    product_count: 2,
  },
  {
    id: 4,
    fan_uid: 1,
    creator_uid: 5,
    creator_username: 'arjunkumar',
    creator_name: 'Arjun Kumar',
    creator_avatar: '/sample-media/id-card-3.png',
    monthly_amount: 199,
    subscription_id: 6,
    plan_name: 'Basic',
    status: 'active',
    started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 28).toISOString(),
    transaction_code: 'TXN-ZEXY-2026-10004',
    image_count: 31,
    video_count: 15,
    audio_count: 7,
    product_count: 4,
  },
  {
    id: 5,
    fan_uid: 1,
    creator_uid: 6,
    creator_username: 'nehapatel',
    creator_name: 'Neha Patel',
    creator_avatar: '/sample-products/navy-zip-shirt.png',
    monthly_amount: 599,
    subscription_id: 7,
    plan_name: 'VIP Monthly',
    status: 'active',
    started_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 15).toISOString(),
    transaction_code: 'TXN-ZEXY-2026-10005',
    image_count: 56,
    video_count: 20,
    audio_count: 11,
    product_count: 8,
  },
  {
    id: 6,
    fan_uid: 1,
    creator_uid: 7,
    creator_username: 'stylestudio',
    creator_name: 'Style Studio',
    creator_avatar: '/sample-products/check-grey-shirt.png',
    monthly_amount: 349,
    subscription_id: 8,
    plan_name: 'Fan Club',
    status: 'active',
    started_at: new Date(Date.now() - 86400000 * 27).toISOString(),
    expires_at: new Date(Date.now() + 86400000 * 3).toISOString(),
    transaction_code: 'TXN-ZEXY-2026-10006',
    image_count: 12,
    video_count: 4,
    audio_count: 2,
    product_count: 6,
  },
];

/** Shown on the membership page when the API returns an empty list (UI preview). */
export const DEMO_MEMBERSHIP_SUBSCRIPTIONS: ActiveSubscription[] = MOCK_ACTIVE_SUBSCRIPTIONS.map(
  (s, i) => ({ ...s, id: 100 + i })
);

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const subscriptionService = {
  /**
   * Get creator's subscription plans
   */
  getCreatorPlans: async (creatorId: number): Promise<SubscriptionPlan[]> => {
    if (ENV.IS_MOCK) {
      await sleep(600);
      return MOCK_PLANS.map((p) => ({ ...p, creator_uid: creatorId }));
    }

    const response = await apiClient.get(`/api/v1/fan/creators/${creatorId}/subscriptions`);
    const data = response.data.data as SubscriptionPlan[];
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
    return getDemoCreatorMembershipPlans(creatorId);
  },

  /**
   * Get fan's active subscriptions
   */
  getMySubscriptions: async (): Promise<ActiveSubscription[]> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return MOCK_ACTIVE_SUBSCRIPTIONS;
    }

    const response = await apiClient.get('/api/v1/fan/subscriptions');
    return response.data.data;
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (subscriptionId: number): Promise<void> => {
    if (ENV.IS_MOCK) {
      await sleep(700);
      return;
    }

    await apiClient.post(`/api/v1/fan/subscriptions/${subscriptionId}/cancel`);
  },

  /**
   * Create a payment intent for subscribing to a plan
   */
  createSubscriptionIntent: async (planId: number): Promise<{
    intent_id: number;
    gateway_order_id: string;
    amount: number;
    currency: string;
    key_id: string;
  }> => {
    if (ENV.IS_MOCK) {
      await sleep(800);
      return {
        intent_id: Math.floor(Math.random() * 10000),
        gateway_order_id: 'order_mock_' + Date.now(),
        amount: 299,
        currency: 'INR',
        key_id: 'rzp_test_xxxxx',
      };
    }

    const response = await apiClient.post('/api/v1/fan/payments/intents', {
      purpose: 'subscription',
      reference_id: planId,
    });
    return response.data.data;
  },

  /**
   * Activate subscription after payment verified
   */
  activateSubscription: async (planId: number, gatewayOrderId: string): Promise<{ status: string; subscription_id: number }> => {
    if (ENV.IS_MOCK) {
      await sleep(1000);
      return { status: 'activated', subscription_id: Math.floor(Math.random() * 1000) };
    }

    const response = await apiClient.post(`/api/v1/fan/subscriptions/${planId}/activate`, {
      gateway_order_id: gatewayOrderId,
    });
    return response.data;
  },
};
