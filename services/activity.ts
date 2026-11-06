import { apiClient } from '@/lib/axios';

export interface ActivityLogItem {
  id: number;
  event_type: string;
  reference_id: number | null;
  reference_type: string | null;
  amount: number | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ActivityResponse {
  total: number;
  page: number;
  limit: number;
  items: ActivityLogItem[];
}

export const activityService = {
  async getHistory(page: number = 1, limit: number = 20): Promise<ActivityResponse> {
    const response = await apiClient.get('/api/v1/fan/activity', {
      params: { page, limit }
    });
    return response.data.data;
  }
};
