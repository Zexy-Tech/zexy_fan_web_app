import { apiClient } from '@/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

export interface Creator {
  id: number;
  user_code?: string;
  username: string;
  name: string;
  avatar: string | null;
  category: string | null;
  subscriber_count: number;
  is_subscribed: boolean;
  is_live?: boolean;
  active_room_id?: string | null;
}

export interface CreatorFilters {
  search?: string;
  category?: string;
  city?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface CreatorsPageResponse {
  items: Creator[];
  total: number;
  limit: number;
  hasMore: boolean;
  nextCursor: number | null;
}

export interface ContentMedia {
  /** null while the item is locked for this viewer (protected media is only served via signed URLs) */
  url: string | null;
  media_type: 'image' | 'video' | 'audio';
}

export interface Content {
  id: number;
  creator_uid: number;
  creator_user_code?: string;
  creator_username: string;
  creator_name: string;
  creator_avatar: string | null;
  title: string;
  description: string | null;
  type: 'image' | 'video' | 'audio' | null;
  thumbnail_url: string | null;
  url: string | null; // null if locked
  media: ContentMedia[];
  media_urls: string[];
  is_paid: boolean;
  price?: number;
  is_exclusive: boolean;
  visibility: 'public' | 'subscription';
  is_locked: boolean; // Computed: true if subscription and not subscribed
  tags: string[];
  is_liked: boolean;
  is_saved: boolean;
  likes_count: number;
  saves_count: number;
  created_on: string;
  duration_seconds?: number | null;
}

export interface Product {
  id: number;
  creator_uid: number;
  name: string;
  description: string;
  price: number;
  image_urls: string[] | null;
  likes_count: number;
  saves_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const feedService = {
  /**
   * Get list of creators
   */
  getCreators: async (): Promise<Creator[]> => {
    const response = await apiClient.get('/api/v1/fan/creators');
    return response.data.data;
  },

  getCreatorsPage: async ({
    cursor = null,
    limit = 40,
    filters = {},
  }: {
    cursor?: number | null;
    limit?: number;
    filters?: CreatorFilters;
  }): Promise<CreatorsPageResponse> => {
    const params: Record<string, string | number> = { limit };
    if (cursor) params.cursor = cursor;
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.city) params.city = filters.city;
    if (filters.gender) params.gender = filters.gender;

    const response = await apiClient.get('/api/v1/fan/creators', { params });
    const payload = response.data.data;

    return {
      items: payload.data,
      total: payload.total,
      limit: payload.limit,
      hasMore: payload.has_more,
      nextCursor: payload.next_cursor,
    };
  },

  /**
   * Get feed content (all creators)
   */
  getFeed: async (): Promise<Content[]> => {
    const response = await apiClient.get('/api/v1/fan/feed');
    return response.data.data;
  },

  /**
   * Get content by specific creator (by ID)
   */
  getCreatorContent: async (creatorId: number): Promise<Content[]> => {
    const response = await apiClient.get(`/api/v1/fan/content/${creatorId}`);
    return response.data.data;
  },

  /**
   * Get creator by username
   */
  getCreatorByUsername: async (username: string): Promise<Creator> => {
    const response = await apiClient.get(`/api/v1/fan/creators/${username}`);
    const payload = response.data?.data;
    return payload?.data ?? payload;
  },

  /**
   * Get content by creator username
   */
  getCreatorContentByUsername: async (username: string): Promise<Content[]> => {
    try {
      const response = await apiClient.get(`/api/v1/fan/creators/${username}/content`);
      const data = response.data?.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.items)) return data.items;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Get products by creator username
   */
  getCreatorProductsByUsername: async (username: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get(`/api/v1/fan/creators/${username}/products`);
      const data = response.data?.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.data)) return data.data;
      if (Array.isArray(data?.items)) return data.items;
      return [];
    } catch {
      return [];
    }
  },
};
