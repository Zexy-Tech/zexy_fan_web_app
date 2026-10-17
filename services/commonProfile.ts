import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';

/** Response body from `GET /api/v1/common/profile` (`data` field). */
export interface FanCommonProfile {
  id: number;
  mobile: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  role: string;
  category?: string | null;
  has_completed_onboarding?: boolean;
  account_status?: string | null;
  bio?: string | null;
  instagram_url?: string | null;
  youtube_url?: string | null;
  facebook_url?: string | null;
  x_url?: string | null;
  pinterest_url?: string | null;
  tiktok_url?: string | null;
  instagram_follower_count?: number | null;
  youtube_follower_count?: number | null;
  facebook_follower_count?: number | null;
  twitter_follower_count?: number | null;
  pinterest_follower_count?: number | null;
  tiktok_follower_count?: number | null;
  /** ISO date string (`YYYY-MM-DD`) or full ISO datetime from API. */
  date_of_birth?: string | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

export interface UpdateCommonProfilePayload {
  name: string;
  username: string;
  mobile: string;
  /** Relative path, `https://…`, or `data:image/…;base64,…` after picking from gallery. */
  avatar: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}

const MOCK_FAN_PROFILE: FanCommonProfile = {
  id: 1,
  mobile: '+919876543210',
  name: 'Demo Fan',
  username: 'demo_fan',
  avatar: null,
  role: 'fan',
  has_completed_onboarding: true,
  date_of_birth: '1999-05-14',
  gender: 'male',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
};

export interface DeleteProfileResponse {
  status: string;
  message: string;
  deletion_period_days?: number;
  scheduled_deletion_date?: string;
  can_cancel?: boolean;
}

export interface MobileChangeRequest {
  new_mobile: string;
}

export interface MobileVerifyRequest {
  new_mobile: string;
  otp: string;
}

export interface MobileChangeResponse {
  status: string;
  message: string;
  otp?: string;
}

export interface MobileVerifyResponse {
  status: string;
  message: string;
  new_mobile: string;
}

export interface VerifyCurrentMobileSendRequest {
  mobile?: string;
}

export interface VerifyCurrentMobileVerifyRequest {
  mobile?: string;
  otp: string;
}

export interface VerifyCurrentMobileResponse {
  status: string;
  message: string;
  otp?: string;
  is_verified?: boolean;
}

export const commonProfileService = {
  getProfile: async (): Promise<FanCommonProfile> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return MOCK_FAN_PROFILE;
    }

    const response = await apiClient.get<{ success: boolean; data: FanCommonProfile }>(
      '/api/v1/common/profile'
    );
    return response.data.data;
  },

  updateProfile: async (payload: UpdateCommonProfilePayload): Promise<FanCommonProfile> => {
    if (ENV.IS_MOCK) {
      await sleep(600);
      return {
        ...MOCK_FAN_PROFILE,
        name: payload.name,
        username: payload.username,
        mobile: payload.mobile,
        avatar: payload.avatar ?? MOCK_FAN_PROFILE.avatar,
        date_of_birth: payload.date_of_birth ?? null,
        gender: payload.gender ?? null,
        city: payload.city ?? null,
        state: payload.state ?? null,
        country: payload.country ?? null,
      };
    }

    const response = await apiClient.put<{ success: boolean; data: FanCommonProfile }>(
      '/api/v1/common/profile',
      payload
    );
    return response.data.data;
  },

  switchToCreator: async (): Promise<{ status: string; message: string; role: string }> => {
    const response = await apiClient.post<{ success: boolean; data: { status: string; message: string; role: string } }>(
      '/api/v1/common/profile/role/creator'
    );
    return response.data.data;
  },

  deleteProfile: async (): Promise<DeleteProfileResponse> => {
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
    }>('/api/v1/common/profile');
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

  requestMobileChange: async (payload: MobileChangeRequest): Promise<MobileChangeResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return {
        status: 'success',
        message: `OTP sent to ${payload.new_mobile}`,
        otp: '1234',
      };
    }

    const response = await apiClient.post<{ success: boolean; data: MobileChangeResponse }>(
      '/api/v1/common/profile/mobile/change/request',
      payload
    );
    return response.data?.data || (response.data as unknown as MobileChangeResponse);
  },

  verifyMobileChange: async (payload: MobileVerifyRequest): Promise<MobileVerifyResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      if (payload.otp !== '1234') {
        throw new Error('Invalid OTP. Use 1234 for testing.');
      }
      MOCK_FAN_PROFILE.mobile = payload.new_mobile;
      return {
        status: 'success',
        message: 'Mobile number updated successfully',
        new_mobile: payload.new_mobile,
      };
    }

    const response = await apiClient.post<{ success: boolean; data: MobileVerifyResponse }>(
      '/api/v1/common/profile/mobile/change/verify',
      payload
    );
    return response.data?.data || (response.data as unknown as MobileVerifyResponse);
  },

  sendCurrentMobileOtp: async (
    payload?: VerifyCurrentMobileSendRequest
  ): Promise<VerifyCurrentMobileResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return {
        status: 'success',
        message: 'OTP sent to your current mobile number',
        otp: '1234',
      };
    }

    const response = await apiClient.post<{ success: boolean; data: VerifyCurrentMobileResponse }>(
      '/api/v1/common/profile/verify-mobile/send-otp',
      payload ?? {}
    );
    return response.data?.data || (response.data as unknown as VerifyCurrentMobileResponse);
  },

  verifyCurrentMobileOtp: async (
    payload: VerifyCurrentMobileVerifyRequest
  ): Promise<VerifyCurrentMobileResponse> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      if (payload.otp !== '1234') {
        throw new Error('Invalid OTP. Use 1234 for testing.');
      }
      return {
        status: 'success',
        message: 'Current mobile verified successfully',
        is_verified: true,
      };
    }

    const response = await apiClient.post<{ success: boolean; data: VerifyCurrentMobileResponse }>(
      '/api/v1/common/profile/verify-mobile/verify-otp',
      payload
    );
    return response.data?.data || (response.data as unknown as VerifyCurrentMobileResponse);
  },
};
