/**
 * Creator Profile Configuration Service
 * 
 * Handles API calls for fetching and updating creator profile configurations.
 * Includes mock data for development.
 */

import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';
import { CreatorProfileConfig } from '@/types/creator-profile';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_PROFILE_CONFIG: CreatorProfileConfig = {
  creatorId: 1,
  username: 'creator_one',
  theme: {
    primaryColor: '#ec4899',
    secondaryColor: '#9333ea',
    gradientStart: '#ec4899',
    gradientEnd: '#9333ea',
    fontFamily: 'Inter',
    borderRadius: 'lg',
    buttonStyle: 'solid',
  },
  intro: {
    greeting: "Hi, I'm Sarah",
    bio: 'Fitness coach helping you achieve your health goals. Join me for exclusive workouts, nutrition tips, and personalized guidance.',
    showAvatar: true,
    avatarStyle: 'circle',
  },
  actionButtons: [
    {
      id: 'brand-enquiry',
      label: 'Brand Enquiry',
      type: 'email',
      action: 'sarah@example.com',
      icon: 'Mail',
      style: 'primary',
    },
    {
      id: 'chat-now',
      label: 'Chat Now',
      type: 'chat',
      action: '/chats',
      icon: 'MessageCircle',
      style: 'secondary',
    },
  ],
  sections: [
    {
      id: 'intro',
      type: 'intro',
      enabled: true,
      order: 0,
      config: {},
    },
    {
      id: 'actions',
      type: 'actions',
      enabled: true,
      order: 1,
      config: {},
    },
    {
      id: 'qa',
      type: 'qa',
      enabled: true,
      order: 2,
      config: {
        showAddQuestion: true,
      },
    },
    {
      id: 'exclusives',
      type: 'exclusives',
      enabled: true,
      order: 3,
      config: {},
    },
    {
      id: 'subscription',
      type: 'subscription',
      enabled: true,
      order: 4,
      config: {},
    },
  ],
  bottomNav: [
    {
      id: 'home',
      label: 'Home',
      icon: 'Home',
      route: '/creators',
      requiresAuth: false,
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: 'MessageCircle',
      route: '/chats',
      requiresAuth: true,
    },
    {
      id: 'subscription',
      label: 'Lock',
      icon: 'Lock',
      route: '/subscriptions',
      requiresAuth: true,
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock configs for other creators
const MOCK_PROFILE_CONFIGS: Record<string, CreatorProfileConfig> = {
  priya_sharma: {
    ...MOCK_PROFILE_CONFIG,
    creatorId: 1,
    username: 'priya_sharma',
    theme: {
      primaryColor: '#ec4899',
      secondaryColor: '#9333ea',
      gradientStart: '#ec4899',
      gradientEnd: '#9333ea',
      fontFamily: 'Inter',
      borderRadius: 'lg',
      buttonStyle: 'solid',
    },
    intro: {
      greeting: "Hi, I'm Priya",
      bio: 'Fashion & lifestyle creator sharing style tips, beauty secrets, and daily inspiration. Join me for exclusive content and personalized fashion advice.',
      showAvatar: true,
      avatarStyle: 'circle',
    },
  },
  arjun_fitness: {
    ...MOCK_PROFILE_CONFIG,
    creatorId: 2,
    username: 'arjun_fitness',
    theme: {
      primaryColor: '#f59e0b',
      secondaryColor: '#ef4444',
      gradientStart: '#f59e0b',
      gradientEnd: '#ef4444',
      fontFamily: 'Inter',
      borderRadius: 'md',
      buttonStyle: 'solid',
    },
    intro: {
      greeting: "Hi, I'm Arjun",
      bio: 'Certified fitness coach helping you achieve your health goals. Get access to exclusive workouts, nutrition plans, and personalized training.',
      showAvatar: true,
      avatarStyle: 'rounded',
    },
  },
  neha_music: {
    ...MOCK_PROFILE_CONFIG,
    creatorId: 3,
    username: 'neha_music',
    theme: {
      primaryColor: '#06b6d4',
      secondaryColor: '#3b82f6',
      gradientStart: '#06b6d4',
      gradientEnd: '#3b82f6',
      fontFamily: 'Inter',
      borderRadius: 'xl',
      buttonStyle: 'solid',
    },
    intro: {
      greeting: "Hi, I'm Neha",
      bio: 'Professional singer and musician. Join me for exclusive music releases, live sessions, and singing masterclasses.',
      showAvatar: true,
      avatarStyle: 'circle',
    },
  },
};

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const creatorProfileService = {
  /**
   * Get profile configuration by username
   * 
   * @param username - Creator username
   * @returns Profile configuration object
   */
  getProfileConfig: async (username: string): Promise<CreatorProfileConfig> => {
    if (ENV.IS_MOCK) {
      await sleep(600);
      
      const config = MOCK_PROFILE_CONFIGS[username];
      if (!config) {
        throw new Error('Profile configuration not found');
      }
      
      return config;
    }

    const response = await apiClient.get(
      `/api/v1/fan/creators/${username}/profile-config`
    );
    return response.data.data.data;
  },

  /**
   * Update profile configuration
   * 
   * @param creatorId - Creator ID
   * @param config - Partial profile configuration to update
   * @returns Updated profile configuration
   */
  updateProfileConfig: async (
    creatorId: number,
    config: Partial<CreatorProfileConfig>
  ): Promise<CreatorProfileConfig> => {
    if (ENV.IS_MOCK) {
      await sleep(800);
      
      // Find existing config
      const existingConfig = Object.values(MOCK_PROFILE_CONFIGS).find(
        c => c.creatorId === creatorId
      );
      
      if (!existingConfig) {
        throw new Error('Profile configuration not found');
      }
      
      // Merge with updates
      const updated = {
        ...existingConfig,
        ...config,
        updatedAt: new Date().toISOString(),
      };
      
      return updated;
    }

    const response = await apiClient.put(
      `/api/v1/creators/${creatorId}/profile-config`,
      config
    );
    return response.data.data;
  },
};
