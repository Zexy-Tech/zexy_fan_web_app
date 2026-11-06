import { apiClient } from '@/lib/axios';

export interface Category {
  slug: string;
  display_name: string;
}

export const categoriesService = {
  /**
   * Fetch all creator categories from the backend.
   */
  getCategories: async (): Promise<Category[]> => {
    const response = await apiClient.get('/api/v1/common/categories');
    const payload = response.data;
    return payload.data ?? payload;
  },
};
