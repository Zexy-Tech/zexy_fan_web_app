/**
 * Creator Profile Configuration Service
 * 
 * Handles API calls for fetching and updating creator profile configurations.
 * Includes mock data for development.
 */

import { apiClient } from '@/lib/axios';
import { CreatorProfileConfig } from '@/types/creator-profile';

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
