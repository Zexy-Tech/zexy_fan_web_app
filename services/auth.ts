import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface SendOTPRequest {
  mobile: string;
  role: 'fan';
}

export interface SendOTPResponse {
  status: string;
  message: string;
}

export interface VerifyOTPRequest {
  mobile: string;
  otp: string;
  role: 'fan';
}

export interface SetupPINRequest {
  pin: string;
}

export interface LoginPINRequest {
  mobile: string;
  pin: string;
  role: 'fan';
}

export interface PINResetInitiateRequest {
  mobile: string;
}

export interface PINResetConfirmRequest {
  mobile: string;
  otp: string;
  new_pin: string;
}

/** Same contract as zexy_api TokenResponse — do not use onboarding_step || n (0 is valid). Prefer ??. */
export interface VerifyOTPResponse {
  access_token: string;
  refresh_token: string;
  session_token: string;
  is_new_user: boolean;
  onboarding_step: number;
}

export interface User {
  id: number;
  mobile: string;
  username: string | null;
  name: string | null;
  avatar: string | null;
  role: 'fan';
  has_completed_onboarding: boolean;
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
  /**
   * Send OTP to mobile number
   */
  sendOTP: async (data: SendOTPRequest): Promise<SendOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(800);
      return {
        status: 'success',
        message: 'OTP sent successfully',
      };
    }

    const response = await apiClient.post('/api/v1/auth/otp/send', data);
    return response.data.data;
  },

  /**
   * Verify OTP and get auth tokens
   */
  verifyOTP: async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(1000);
      
      // Mock: Accept any 4-digit OTP
      if (data.otp.length !== 4) {
        throw new Error('Invalid OTP');
      }

      return {
        access_token: 'mock_access_token_' + Date.now(),
        refresh_token: 'mock_refresh_token_' + Date.now(),
        session_token: 'mock_session_token_' + Date.now(),
        is_new_user: false,
        onboarding_step: 5,
      };
    }

    const response = await apiClient.post('/api/v1/auth/otp/verify', data);
    return response.data.data;
  },

  /**
   * Set 4-digit PIN
   */
  setupPIN: async (data: SetupPINRequest): Promise<{ status: string; message: string }> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return { status: 'success', message: 'PIN setup successfully' };
    }
    const response = await apiClient.post('/api/v1/auth/pin/setup', data);
    return response.data.data;
  },

  /**
   * Login with mobile and PIN
   */
  loginWithPIN: async (data: LoginPINRequest): Promise<VerifyOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(800);
      return {
        access_token: 'mock_access_token_pin_' + Date.now(),
        refresh_token: 'mock_refresh_token_pin_' + Date.now(),
        session_token: 'mock_session_token_pin_' + Date.now(),
        is_new_user: false,
        onboarding_step: 5,
      };
    }
    const response = await apiClient.post('/api/v1/auth/pin/login', data);
    return response.data.data;
  },

  /**
   * Initiate PIN reset by sending OTP
   */
  initiatePINReset: async (data: PINResetInitiateRequest): Promise<{ status: string; message: string }> => {
    if (ENV.IS_MOCK) {
      await sleep(800);
      return { status: 'success', message: 'OTP sent successfully' };
    }
    const response = await apiClient.post('/api/v1/auth/pin/reset/initiate', data);
    return response.data.data;
  },

  /**
   * Confirm PIN reset with OTP and new PIN
   */
  confirmPINReset: async (data: PINResetConfirmRequest): Promise<{ status: string; message: string }> => {
    if (ENV.IS_MOCK) {
      await sleep(1000);
      return { status: 'success', message: 'PIN reset successfully' };
    }
    const response = await apiClient.post('/api/v1/auth/pin/reset/confirm', data);
    return response.data.data;
  },

  /**
   * Get current user profile
   */
  getMe: async (): Promise<User> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return MOCK_USER;
    }

    const response = await apiClient.get('/api/v1/auth/me');
    return response.data.data;
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
   * Permanently delete the authenticated account (call after OTP re-verification).
   * Backend may require `otp` in the body when wired.
   */
  deleteAccount: async (payload?: { otp?: string }): Promise<void> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return;
    }

    await apiClient.delete('/api/v1/auth/account', { data: payload ?? {} });
  },
};
