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
  niche?: string | null;
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
};
