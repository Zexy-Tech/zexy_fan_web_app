import { apiClient } from '@/lib/axios';

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
  creator_user_code?: string;
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
// API FUNCTIONS
// ============================================================================

export const subscriptionService = {
  /**
   * Get creator's subscription plans
   */
  getCreatorPlans: async (creatorId: number): Promise<SubscriptionPlan[]> => {
    const response = await apiClient.get(`/api/v1/fan/creators/${creatorId}/subscriptions`);
    return response.data.data as SubscriptionPlan[];
  },

  /**
   * Get fan's active subscriptions
   */
  getMySubscriptions: async (): Promise<ActiveSubscription[]> => {
    const response = await apiClient.get('/api/v1/fan/subscriptions');
    const data = response.data.data;

    if (Array.isArray(data)) {
      return data.map((s: any) => ({
        ...s,
        // Ensure compatibility if backend uses different names or cases
        creator_username: s.creator_username || s.creator_user?.username || '',
        creator_name: s.creator_name || s.creator_user?.name || '',
        creator_avatar: s.creator_avatar || s.creator_user?.avatar || null,
        plan_name: s.plan_name || s.subscription_plan?.name || 'Active Plan',
      }));
    }

    return data;
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async (subscriptionId: number): Promise<void> => {
    await apiClient.post(`/api/v1/fan/subscriptions/${subscriptionId}/cancel`);
  },

  /**
   * Create a payment intent for subscribing to a plan
   */
  createSubscriptionIntent: async (
    planId: number
  ): Promise<{
    intent_id: number;
    gateway_order_id: string;
    amount: number;
    currency: string;
    key_id: string;
    mock_checkout_url?: string;
  }> => {
    const response = await apiClient.post('/api/v1/fan/payments/intents', {
      purpose: 'subscription',
      reference_id: planId,
    });
    return response.data.data;
  },

  /**
   * Activate subscription after payment verified
   */
  activateSubscription: async (
    subscriptionId: number,
    gatewayOrderId: string
  ): Promise<{ status: string; subscription_id: number }> => {
    const response = await apiClient.post(`/api/v1/fan/subscriptions/${subscriptionId}/activate`, {
      gateway_order_id: gatewayOrderId,
    });
    return response.data.data;
  },
};
