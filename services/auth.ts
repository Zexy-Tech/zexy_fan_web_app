import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface SendOTPRequest {
  mobile: string;
  role?: 'fan';
}

export interface SendOTPResponse {
  status: string;
  message: string;
  auth_method: 'otp' | 'pin';
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

export interface DeleteAccountResponse {
  status: string;
  message: string;
  deletion_period_days?: number;
  scheduled_deletion_date?: string;
  can_cancel?: boolean;
}

export interface CheckMobileRequest {
  mobile: string;
  name?: string;
}

export interface CheckMobileResponse {
  exists: boolean;
  message: string;
  requires_onboarding?: boolean;
}

export interface SignupSetPinRequest {
  mobile: string;
  name: string;
  pin: string;
  confirm_pin: string;
  role?: 'fan';
  device_name?: string;
}

export interface MobileLoginRequest {
  mobile: string;
  pin: string;
  device_name?: string;
}

export interface GoogleCheckRequest {
  id_token: string;
}

export interface TruecallerCheckRequest {
  request_id?: string;
  access_token?: string;
  phone?: string;
  name?: string;
}

export interface OAuthCheckResponse {
  exists: boolean;
  has_pin: boolean;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  message: string;
}

export interface GoogleAuthRequest {
  id_token: string;
  pin?: string;
  confirm_pin?: string;
  role?: 'fan';
  device_name?: string;
}

export interface TruecallerAuthRequest {
  access_token?: string;
  request_id?: string;
  phone?: string;
  name?: string;
  pin?: string;
  confirm_pin?: string;
  role?: 'fan';
  device_name?: string;
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
  /**
   * Send OTP to mobile number
   */
  sendOTP: async (data: SendOTPRequest): Promise<SendOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(800);
      return {
        status: 'success',
        message: 'PIN login required',
        auth_method: 'pin',
      };
    }

    const response = await apiClient.post('/api/v1/auth/otp/send', {
      mobile: data.mobile,
    });
    return response.data?.data || response.data;
  },

  /**
   * Verify OTP and get auth tokens
   */
  verifyOTP: async (data: VerifyOTPRequest): Promise<VerifyOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(1000);
      
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
   * Check mobile availability without OTP
   * POST /api/v1/auth/mobile/check
   */
  checkMobile: async (data: CheckMobileRequest): Promise<CheckMobileResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(300);
      const cleanMobile = data.mobile.replace(/\D/g, '').slice(-10);
      const isRegistered = ['9876543210', '9999999999', '9123456780'].includes(cleanMobile);
      return {
        exists: isRegistered,
        message: isRegistered ? 'Mobile already registered' : 'Mobile available',
      };
    }
    const response = await apiClient.post('/api/v1/auth/mobile/check', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Sign up and set PIN without OTP
   * POST /api/v1/auth/signup/set-pin
   */
  signupSetPin: async (data: SignupSetPinRequest): Promise<VerifyOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return {
        access_token: 'mock_jwt_token_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        session_token: 'mock_session_' + Date.now(),
        is_new_user: true,
        onboarding_step: 2,
      };
    }
    const response = await apiClient.post('/api/v1/auth/signup/set-pin', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Login with mobile and PIN
   * POST /api/v1/auth/login/mobile
   */
  loginMobile: async (data: MobileLoginRequest): Promise<VerifyOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return {
        access_token: 'mock_jwt_token_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        session_token: 'mock_session_' + Date.now(),
        is_new_user: false,
        onboarding_step: 5,
      };
    }
    const response = await apiClient.post('/api/v1/auth/login/mobile', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Check Google account status
   * POST /api/v1/auth/google/check
   */
  checkGoogle: async (data: GoogleCheckRequest): Promise<OAuthCheckResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(300);
      return {
        exists: false,
        has_pin: false,
        message: 'New account. Set PIN to complete sign up.',
      };
    }
    const response = await apiClient.post('/api/v1/auth/google/check', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Check Truecaller account status
   * POST /api/v1/auth/truecaller/check
   */
  checkTruecaller: async (data: TruecallerCheckRequest): Promise<OAuthCheckResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(300);
      return {
        exists: false,
        has_pin: false,
        message: 'New account. Set PIN to complete sign up.',
      };
    }
    const response = await apiClient.post('/api/v1/auth/truecaller/check', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Authenticate via Google ID Token
   * POST /api/v1/auth/google
   */
  googleLogin: async (data: GoogleAuthRequest): Promise<VerifyOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return {
        access_token: 'mock_jwt_google_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        session_token: 'mock_session_' + Date.now(),
        is_new_user: false,
        onboarding_step: 5,
      };
    }
    const response = await apiClient.post('/api/v1/auth/google', data);
    return response.data?.data ?? response.data;
  },

  /**
   * Authenticate via Truecaller callback
   * POST /api/v1/auth/truecaller/callback
   */
  truecallerCallback: async (data: TruecallerAuthRequest): Promise<VerifyOTPResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return {
        access_token: 'mock_jwt_tc_' + Date.now(),
        refresh_token: 'mock_refresh_' + Date.now(),
        session_token: 'mock_session_' + Date.now(),
        is_new_user: false,
        onboarding_step: 5,
      };
    }
    const response = await apiClient.post('/api/v1/auth/truecaller/callback', data);
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
  refreshToken: async (data: { refresh_token: string; session_token: string }): Promise<VerifyOTPResponse> => {
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
