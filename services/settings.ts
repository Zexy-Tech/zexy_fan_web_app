import { apiClient } from '@/lib/axios';

export interface UserSettings {
  user_id: number;
  language: string;
  theme?: string | null;
}

export interface UpdateUserSettingsPayload {
  language?: string;
  theme?: string;
}

export const settingsService = {
  getSettings: async (): Promise<UserSettings | null> => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const response = await apiClient.get<UserSettings | { success: boolean; data: UserSettings }>(
        '/api/v1/common/settings'
      );
      const data = (response.data as { data?: UserSettings }).data || response.data;
      return data as UserSettings;
    } catch {
      return null;
    }
  },

  updateSettings: async (payload: UpdateUserSettingsPayload): Promise<UserSettings | null> => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    try {
      const response = await apiClient.patch<UserSettings | { success: boolean; data: UserSettings }>(
        '/api/v1/common/settings',
        payload
      );
      const data = (response.data as { data?: UserSettings }).data || response.data;
      return data as UserSettings;
    } catch {
      return null;
    }
  },
};
