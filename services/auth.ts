import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

/** Same contract as zexy_api TokenResponse — do not use onboarding_step || n (0 is valid). Prefer ??. */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  session_token: string;
  is_new_user: boolean;
  onboarding_step: number;
}

export interface DeleteAccountResponse {
  status: string;
  message: string;
  deletion_period_days?: number;
  scheduled_deletion_date?: string;
  can_cancel?: boolean;
}

export interface UserProfileUpdateRequest {
  name?: string;
  mobile?: string;
  city?: string;
  date_of_birth?: string;
  gender?: string;
}

export interface User {
  id: number;
  user_code?: string;
  mobile: string | null;
  username: string | null;
  name: string | null;
  avatar: string | null;
  role: 'fan' | 'creator' | 'admin';
  has_completed_onboarding: boolean;
  onboarding_step?: number;
  is_mobile_verified?: boolean;
  email?: string | null;
  city?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_USER: User = {
  id: 1,
  mobile: '+919876543210',
  username: 'fan_user',
  name: 'John Doe',
  avatar: null,
  role: 'fan',
  has_completed_onboarding: true,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const authService = {
  /** The only login: logs in a known Google account, otherwise signs it up. */
  google: async (idToken: string): Promise<AuthTokens> => {
    const response = await apiClient.post('/api/v1/auth/google', {
      id_token: idToken, app: 'fan', device_name: 'web',
    });
    return response.data?.data ?? response.data;
  },

  /**
   * Complete or update user profile
   * PUT /api/v1/users/me/profile
   */
  updateProfile: async (data: UserProfileUpdateRequest): Promise<User> => {
    if (ENV.IS_MOCK) {
      await sleep(400);
      return {
        ...MOCK_USER,
        ...data,
        has_completed_onboarding: true,
      };
    }
    const response = await apiClient.put('/api/v1/users/me/profile', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Refresh JWT token
   * POST /api/v1/auth/refresh
   */
  refreshToken: async (data: { refresh_token: string; session_token: string }): Promise<AuthTokens> => {
    const response = await apiClient.post('/api/v1/auth/refresh', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Get current user profile
   */
  getMe: async (): Promise<User> => {
    if (ENV.IS_MOCK) {
      await sleep(300);
      return MOCK_USER;
    }

    const response = await apiClient.get('/api/v1/users/me');
    return response.data?.data ?? response.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    if (ENV.IS_MOCK) {
      await sleep(300);
      return;
    }

    await apiClient.post('/api/v1/sessions/logout');
  },

  /**
   * Delete the authenticated account with a 1-month (30-day) permanent deletion.
   * Calls DELETE /api/v1/common/profile.
   */
  deleteAccount: async (payload?: { otp?: string; token?: string }): Promise<DeleteAccountResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return {
        status: 'success',
        message:
          'Your account has been scheduled for permanent deletion in 30 days. No cancellation is permitted and you cannot log in during this period.',
        deletion_period_days: 30,
        scheduled_deletion_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        can_cancel: false,
      };
    }

    const headers: Record<string, string> = {};
    const token = payload?.token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await apiClient.delete<{
      success: boolean;
      data: {
        status: string;
        message: string;
        deletion_period_days?: number;
        scheduled_deletion_date?: string;
        can_cancel?: boolean;
      };
      message?: string;
    }>('/api/v1/common/profile', {
      headers,
      data: payload?.otp ? { otp: payload.otp } : undefined,
    });

    const result = response.data?.data || response.data;
    return {
      status: result?.status || 'success',
      message:
        result?.message ||
        response.data?.message ||
        'Your account has been scheduled for permanent deletion in 30 days. No cancellation is permitted and you cannot log in during this period.',
      deletion_period_days: result?.deletion_period_days ?? 30,
      scheduled_deletion_date: result?.scheduled_deletion_date,
      can_cancel: result?.can_cancel ?? false,
    };
  },
};
