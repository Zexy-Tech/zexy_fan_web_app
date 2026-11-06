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
    try {
      const response = await apiClient.get(
        `/api/v1/fan/creators/${username}/profile-config`
      );
      const payload = response.data?.data;
      const data = payload?.data ?? payload ?? {};
      
      const rawTheme = data.theme || {};
      const rawIntro = data.intro || {};

      // Map snake_case from backend to camelCase for frontend
      return {
        creatorId: data.creator_id ?? 0,
        username: data.username ?? username,
        is_live: Boolean(data.is_live),
        active_room_id: data.active_room_id ?? null,
        theme: {
          primaryColor: rawTheme.primaryColor || rawTheme.primary_color || '#ffffff',
          secondaryColor: rawTheme.secondaryColor || rawTheme.secondary_color || '#3f3f46',
          gradientStart: rawTheme.gradientStart || rawTheme.gradient_start || '#9333ea',
          gradientEnd: rawTheme.gradientEnd || rawTheme.gradient_end || '#ec4899',
          fontFamily: rawTheme.fontFamily || rawTheme.font_family || 'Inter',
          borderRadius: rawTheme.borderRadius || rawTheme.border_radius || 'md',
          buttonStyle: rawTheme.buttonStyle || rawTheme.button_style || 'solid',
        },
        intro: {
          greeting: rawIntro.greeting || '',
          bio: rawIntro.bio || '',
          showAvatar: rawIntro.showAvatar ?? rawIntro.show_avatar ?? true,
          avatarStyle: rawIntro.avatarStyle || rawIntro.avatar_style || 'circle',
        },
        actionButtons: (Array.isArray(data.action_buttons) ? data.action_buttons : []).map((btn: any) => ({
          id: btn?.id || `btn-${Math.random()}`,
          label: btn?.label || '',
          type: btn?.type || 'custom_link',
          action: btn?.action || '',
          icon: btn?.icon || null,
          style: btn?.style || 'secondary',
        })),
        sections: (Array.isArray(data.sections) ? data.sections : []).map((sec: any) => ({
          id: sec?.id || `sec-${Math.random()}`,
          type: sec?.type || 'intro',
          enabled: sec?.enabled ?? true,
          order: sec?.order ?? 0,
          config: sec?.config || {},
        })),
        bottomNav: (Array.isArray(data.bottom_nav) ? data.bottom_nav : []).map((nav: any) => ({
          id: nav?.id || `nav-${Math.random()}`,
          label: nav?.label || '',
          icon: nav?.icon || 'Home',
          route: nav?.route || '/feed',
          requiresAuth: nav?.requiresAuth ?? false,
        })),
        createdAt: data.created_at || new Date().toISOString(),
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch {
      // Return safe default profile config if endpoint fails or creator has no custom config
      return {
        creatorId: 0,
        username,
        is_live: false,
        active_room_id: null,
        theme: {
          primaryColor: '#ffffff',
          secondaryColor: '#3f3f46',
          gradientStart: '#9333ea',
          gradientEnd: '#ec4899',
          fontFamily: 'Inter',
          borderRadius: 'md',
          buttonStyle: 'solid',
        },
        intro: {
          greeting: '',
          bio: '',
          showAvatar: true,
          avatarStyle: 'circle',
        },
        actionButtons: [],
        sections: [],
        bottomNav: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
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
    const response = await apiClient.put(
      `/api/v1/creators/${creatorId}/profile-config`,
      config
    );
    return response.data.data;
  },
};
