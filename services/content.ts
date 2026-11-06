import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';
import type { Content, Product } from './feed';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentDetail extends Content {
  duration_seconds: number | null;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CONTENT_DETAIL: ContentDetail = {
  id: 2,
  creator_uid: 2,
  creator_username: 'creator_two',
  creator_name: 'Mike Chen',
  creator_avatar: null,
  title: 'Premium Pasta Recipe',
  description: 'Learn my secret technique for perfect pasta. This comprehensive guide covers everything from selecting the right ingredients to achieving the perfect al dente texture.',
  url: null,
  type: 'video',
  media: [{ url: 'https://example.com/preview2.mp4', media_type: 'video' }],
  media_urls: ['https://example.com/preview2.mp4'],
  is_paid: true,
  is_exclusive: false,
  visibility: 'public',
  is_locked: true,
  tags: [],
  is_liked: false,
  is_saved: false,
  created_on: new Date(Date.now() - 3600000).toISOString(),
  duration_seconds: 1200,
  thumbnail_url: null,
  likes_count: 15,
  saves_count: 3,
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const contentService = {
  /**
   * Get content detail
   */
  getContentDetail: async (contentId: number): Promise<ContentDetail> => {
    if (ENV.IS_MOCK) {
      await sleep(600);
      return { ...MOCK_CONTENT_DETAIL, id: contentId };
    }

    const response = await apiClient.get(`/api/v1/fan/content/${contentId}/detail`);
    return response.data.data;
  },

  /**
   * Get saved content
   */
  getSavedContent: async (type?: 'image' | 'video' | 'audio'): Promise<Content[]> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return []; // Return empty for mock or some dummy data if needed
    }

    const response = await apiClient.get('/api/v1/fan/content/saved', {
      params: { type },
    });
    return response.data.data || response.data;
  },

  /**
   * Get saved products
   */
  getSavedProducts: async (): Promise<Product[]> => {
    if (ENV.IS_MOCK) {
      await sleep(500);
      return [];
    }

    const response = await apiClient.get('/api/v1/fan/products/saved');
    return response.data.data || response.data;
  },

  /**
   * Unlock content after payment (called after payment verification)
   */
  unlockContent: async (contentId: number): Promise<ContentDetail> => {
    if (ENV.IS_MOCK) {
      await sleep(800);
      return {
        ...MOCK_CONTENT_DETAIL,
        id: contentId,
        url: 'https://example.com/unlocked_video.mp4',
        is_locked: false,
      };
    }

    const response = await apiClient.post(`/api/v1/common/content/${contentId}/unlock-after-payment`);
    return response.data.data;
  },

  /**
   * Like content
   */
  likeContent: async (contentId: number): Promise<{ liked: boolean }> => {
    const response = await apiClient.post(`/api/v1/fan/content/items/${contentId}/like`);
    return response.data;
  },

  /**
   * Unlike content
   */
  unlikeContent: async (contentId: number): Promise<{ liked: boolean }> => {
    const response = await apiClient.delete(`/api/v1/fan/content/items/${contentId}/like`);
    return response.data;
  },

  /**
   * Save content
   */
  saveContent: async (contentId: number): Promise<{ saved: boolean }> => {
    const response = await apiClient.post(`/api/v1/fan/content/items/${contentId}/save`);
    return response.data;
  },

  /**
   * Unsave content
   */
  unsaveContent: async (contentId: number): Promise<{ saved: boolean }> => {
    const response = await apiClient.delete(`/api/v1/fan/content/items/${contentId}/save`);
    return response.data;
  },
};
