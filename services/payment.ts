import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateIntentRequest {
  purpose: 'subscription' | 'content' | 'product' | 'message' | 'live_access' | 'tip';
  reference_id: number;
  amount?: number; // Required for tips
  currency?: string;
  reference_type?: string; // 'creator' for standalone tips
  extra_data?: Record<string, any>;
}

export interface CreateIntentResponse {
  intent_id: number;
  gateway_order_id: string;
  amount: number;
  currency: string;
  key_id: string;
  mock_checkout_url?: string | null;
  payment_gateway?: string | null;
}

export type CheckoutSimOutcome = 'success' | 'failure' | 'cancel';

export interface StartCheckoutParams {
  intent: CreateIntentResponse;
  /** When omitted: success if ENV.IS_MOCK, else success (no real SDK yet). */
  simulate?: CheckoutSimOutcome;
}

export interface VerifyPaymentRequest {
  gateway_order_id: string;
  gateway_payment_id: string;
  gateway_signature: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  transaction_id: number;
  purpose: string;
  reference_id: number;
}

export interface Transaction {
  id: number;
  amount: number;
  gross_amount?: number;
  currency: string;
  purpose: string;
  reference_id: number | null;
  status: string;
  gateway_payment_id: string;
  created_at: string;
  creator_name?: string;
  creator_username?: string;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const paymentService = {
  /**
   * Create payment intent
   */
  createIntent: async (data: CreateIntentRequest): Promise<CreateIntentResponse> => {
    const response = await apiClient.post('/api/v1/fan/payments/create-intent', data);
    return response.data.data;
  },

  /**
   * Client-side checkout simulation (no gateway SDK). Use verifyPayload with verifyPayment when outcome is success.
   */
  startCheckout: async (
    params: StartCheckoutParams
  ): Promise<{
    outcome: CheckoutSimOutcome;
    verifyPayload?: VerifyPaymentRequest;
    errorMessage?: string;
  }> => {
    const intent = params.intent;
    
    // In dev, we always simulate success for now.
    const simulate: CheckoutSimOutcome = params.simulate ?? 'success';

    await sleep(simulate === 'cancel' ? 150 : 400);

    if (simulate === 'cancel') {
      return { outcome: 'cancel' };
    }
    if (simulate === 'failure') {
      return { outcome: 'failure', errorMessage: 'Checkout failed (simulated)' };
    }

    const verifyPayload: VerifyPaymentRequest = {
      gateway_order_id: intent.gateway_order_id,
      gateway_payment_id: 'pay_mock_' + Date.now(),
      gateway_signature: 'sig_mock_' + Date.now(),
    };
    return { outcome: 'success', verifyPayload };
  },

  /**
   * Verify payment after gateway success
   */
  verifyPayment: async (data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> => {
    const response = await apiClient.post('/api/v1/fan/payments/verify', data);
    return response.data.data;
  },

  /**
   * Get payment history
   */
  getHistory: async (skip: number = 0, limit: number = 50): Promise<Transaction[]> => {
    const response = await apiClient.get('/api/v1/fan/payments', {
      params: { skip, limit }
    });
    return response.data.data;
  },

  /**
   * Get transaction details
   */
  getDetail: async (transactionId: number): Promise<Transaction> => {
    const response = await apiClient.get(`/api/v1/fan/payments/${transactionId}`);
    return response.data.data;
  },

  /**
   * Download PDF invoice
   */
  downloadInvoice: async (transactionId: number): Promise<void> => {
    try {
      const response = await apiClient.get(`/api/v1/fan/payments/transactions/${transactionId}/invoice`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Zexy_Invoice_${transactionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Invoice download failed:', error);
      throw error;
    }
  }
};
