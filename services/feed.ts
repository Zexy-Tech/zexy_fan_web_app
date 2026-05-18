import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface Creator {
  id: number;
  username: string;
  name: string;
  avatar: string | null;
  category: string | null;
  subscriber_count: number;
  is_subscribed: boolean;
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
  url: string;
  media_type: 'image' | 'video' | 'audio';
}

export interface Content {
  id: number;
  creator_uid: number;
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
}

export interface Product {
  id: number;
  creator_uid: number;
  name: string;
  description: string;
  price: number;
  image_urls: string[] | null;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CREATORS: Creator[] = [
  {
    id: 1,
    username: 'priya_sharma',
    name: 'Priya Sharma',
    avatar: null,
    category: 'Fashion & Lifestyle',
    subscriber_count: 125000,
    is_subscribed: false,
  },
  {
    id: 2,
    username: 'arjun_fitness',
    name: 'Arjun Kumar',
    avatar: null,
    category: 'Fitness Coach',
    subscriber_count: 89000,
    is_subscribed: false,
  },
  {
    id: 3,
    username: 'neha_music',
    name: 'Neha Patel',
    avatar: null,
    category: 'Singer & Musician',
    subscriber_count: 210000,
    is_subscribed: true,
  },
];

const MOCK_CONTENT: Content[] = [
  // Creator 1 (Priya Sharma - Fashion & Lifestyle)
  {
    id: 1,
    creator_uid: 1,
    creator_username: 'priya_sharma',
    creator_name: 'Priya Sharma',
    creator_avatar: null,
    title: 'Summer Fashion Lookbook',
    description: 'My favorite summer outfits and styling tips',
    url: 'https://example.com/image1.jpg',
    media: [{ url: 'https://example.com/image1.jpg', media_type: 'image' }],
    media_urls: ['https://example.com/image1.jpg'],
    is_paid: false,
    is_exclusive: false,
    visibility: 'public',
    is_locked: false,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date().toISOString(),
  },
  {
    id: 4,
    creator_uid: 1,
    creator_username: 'priya_sharma',
    creator_name: 'Priya Sharma',
    creator_avatar: null,
    title: 'Makeup Tutorial: Evening Glam',
    description: 'Step-by-step evening makeup look',
    url: 'https://example.com/video4.mp4',
    media: [{ url: 'https://example.com/video4.mp4', media_type: 'video' }],
    media_urls: ['https://example.com/video4.mp4'],
    is_paid: false,
    is_exclusive: false,
    visibility: 'public',
    is_locked: false,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 5,
    creator_uid: 1,
    creator_username: 'priya_sharma',
    creator_name: 'Priya Sharma',
    creator_avatar: null,
    title: 'Exclusive: Behind My Photoshoot',
    description: 'Premium behind-the-scenes content from my latest shoot',
    url: null, // Locked
    media: [{ url: 'https://example.com/preview5.mp4', media_type: 'video' }],
    media_urls: ['https://example.com/preview5.mp4'],
    is_paid: true,
    is_exclusive: true,
    visibility: 'subscription',
    is_locked: true,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 6,
    creator_uid: 1,
    creator_username: 'priya_sharma',
    creator_name: 'Priya Sharma',
    creator_avatar: null,
    title: 'Personal Style Guide',
    description: 'Complete guide to finding your personal style',
    url: null, // Locked
    media: [{ url: 'https://example.com/locked_image.jpg', media_type: 'image' }],
    media_urls: ['https://example.com/locked_image.jpg'],
    is_paid: true,
    is_exclusive: false,
    visibility: 'subscription',
    is_locked: true,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 259200000).toISOString(),
  },

  // Creator 2 (Arjun Kumar - Fitness Coach)
  {
    id: 2,
    creator_uid: 2,
    creator_username: 'arjun_fitness',
    creator_name: 'Arjun Kumar',
    creator_avatar: null,
    title: 'Morning Workout Routine',
    description: 'Start your day with this energizing 20-minute workout',
    url: 'https://example.com/video2.mp4',
    media: [{ url: 'https://example.com/video2.mp4', media_type: 'video' }],
    media_urls: ['https://example.com/video2.mp4'],
    is_paid: false,
    is_exclusive: false,
    visibility: 'public',
    is_locked: false,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 7,
    creator_uid: 2,
    creator_username: 'arjun_fitness',
    creator_name: 'Arjun Kumar',
    creator_avatar: null,
    title: 'Advanced Strength Training',
    description: 'Premium workout program for muscle building',
    url: null, // Locked
    media: [{ url: 'https://example.com/preview7.mp4', media_type: 'video' }],
    media_urls: ['https://example.com/preview7.mp4'],
    is_paid: true,
    is_exclusive: true,
    visibility: 'subscription',
    is_locked: true,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 8,
    creator_uid: 2,
    creator_username: 'arjun_fitness',
    creator_name: 'Arjun Kumar',
    creator_avatar: null,
    title: 'Nutrition Plan',
    description: 'Complete meal plan for fitness goals',
    url: null, // Locked
    media: [{ url: 'https://example.com/locked_image.jpg', media_type: 'image' }],
    media_urls: ['https://example.com/locked_image.jpg'],
    is_paid: true,
    is_exclusive: false,
    visibility: 'subscription',
    is_locked: true,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 172800000).toISOString(),
  },

  // Creator 3 (Neha Patel - Singer & Musician)
  {
    id: 3,
    creator_uid: 3,
    creator_username: 'neha_music',
    creator_name: 'Neha Patel',
    creator_avatar: null,
    title: 'New Single: Dil Ki Baat',
    description: 'My latest single - listen now!',
    url: 'https://example.com/audio3.mp3',
    media: [{ url: 'https://example.com/audio3.mp3', media_type: 'audio' }],
    media_urls: ['https://example.com/audio3.mp3'],
    is_paid: false,
    is_exclusive: false,
    visibility: 'public',
    is_locked: false,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 9,
    creator_uid: 3,
    creator_username: 'neha_music',
    creator_name: 'Neha Patel',
    creator_avatar: null,
    title: 'Live Concert Recording',
    description: 'Exclusive recording from my Mumbai concert',
    url: null, // Locked
    media: [{ url: 'https://example.com/preview9.mp4', media_type: 'video' }],
    media_urls: ['https://example.com/preview9.mp4'],
    is_paid: true,
    is_exclusive: true,
    visibility: 'subscription',
    is_locked: true,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 10,
    creator_uid: 3,
    creator_username: 'neha_music',
    creator_name: 'Neha Patel',
    creator_avatar: null,
    title: 'Singing Masterclass',
    description: 'Learn vocal techniques from a professional',
    url: null, // Locked
    media: [{ url: 'https://example.com/locked_video.mp4', media_type: 'video' }],
    media_urls: ['https://example.com/locked_video.mp4'],
    is_paid: true,
    is_exclusive: false,
    visibility: 'subscription',
    is_locked: true,
    tags: [],
    is_liked: false,
    is_saved: false,
    created_on: new Date(Date.now() - 172800000).toISOString(),
  },
];

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
    const payload = response.data.data;
    return payload.data ?? payload;
  },

  /**
   * Get content by creator username
   */
  getCreatorContentByUsername: async (username: string): Promise<Content[]> => {
    const response = await apiClient.get(`/api/v1/fan/creators/${username}/content`);
    return response.data.data;
  },

  /**
   * Get products by creator username
   */
  getCreatorProductsByUsername: async (username: string): Promise<Product[]> => {
    const response = await apiClient.get(`/api/v1/fan/creators/${username}/products`);
    return response.data.data;
  },
};
