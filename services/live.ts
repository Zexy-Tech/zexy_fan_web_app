import { apiClient } from '@/lib/axios';

export interface LiveSession {
  id: number;
  room_id: string;
  creator_uid: number;
  creator_username: string;
  creator_name: string;
  creator_avatar: string | null;
  viewer_count: number;
  is_paid: boolean;
  price: number;
}

export const liveService = {
  /**
   * List all currently active live sessions.
   */
  getActiveLives: async (): Promise<LiveSession[]> => {
    const response = await apiClient.get('/api/v1/common/live');
    const payload = response.data;
    // Handle the standard wrapper: { success: true, data: [...] }
    return payload.data ?? payload;
  },
};
