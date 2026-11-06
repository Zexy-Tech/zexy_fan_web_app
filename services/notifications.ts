import { apiClient } from '@/lib/axios';

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceRegistration {
  id: number;
  user_id?: number;
  token: string;
  platform: string;
  browser: string;
  device_label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface RegisterDevicePayload {
  fcm_token: string;
  platform?: string;
  browser?: string;
  device_label?: string;
}

export interface NotificationPreferences {
  push_enabled: boolean;
  telegram_enabled: boolean;
  email_enabled: boolean;
  announcements_enabled: boolean;
  content_updates_enabled: boolean;
  live_alerts_enabled: boolean;
  chat_notifications_enabled: boolean;
  subscription_reminders_enabled: boolean;
  promotional_enabled: boolean;
  fcm_token?: string | null;
  telegram_chat_id?: string | null;
  permission_status?: string | null;
  permission_updated_at?: string | null;
}

export interface CreatorSummary {
  id: number;
  username: string;
  name: string;
  avatar_url?: string | null;
}

export interface FanNotificationItem {
  id: number;
  type: string;
  title: string;
  message: string;
  action_url?: string | null;
  reference_id?: number | null;
  reference_type?: string | null;
  extra_data?: Record<string, unknown> | null;
  creator?: CreatorSummary | null;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

export interface FanNotificationListResponse {
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  items: FanNotificationItem[];
}

export interface AdminBulkNotificationRequest {
  title: string;
  body?: string;
  description?: string;
  action_url?: string;
  targeted_ids?: number[];
  city?: string | string[];
  gender?: string | string[];
  select_fan?: string | (number | string)[];
  select_creator?: string | (number | string)[];
}

export interface AdminBulkNotificationResponse {
  notification_id: number;
  users_targeted: number;
  notifications_queued: number;
  status?: string;
}

export interface AdminNotificationHistoryItem {
  id: number;
  title: string;
  body: string;
  action_url?: string | null;
  status: string;
  users_targeted: number;
  successful_sends: number;
  failed_sends: number;
  created_at: string;
  sent_at?: string | null;
}

// ============================================================================
// NOTIFICATION SERVICE
// ============================================================================

export const notificationService = {
  // Device registration
  async registerDevice(payload: RegisterDevicePayload): Promise<DeviceRegistration> {
    const res = await apiClient.post('/api/v1/common/notifications/devices', payload);
    return res.data?.data ?? res.data;
  },

  async listDevices(activeOnly = true): Promise<DeviceRegistration[]> {
    const res = await apiClient.get('/api/v1/common/notifications/devices', {
      params: { active_only: activeOnly },
    });
    return res.data?.data ?? res.data;
  },

  async deactivateDeviceById(deviceId: number): Promise<{ status: string; message: string }> {
    const res = await apiClient.delete(`/api/v1/common/notifications/devices/${deviceId}`);
    return res.data?.data ?? res.data;
  },

  async deactivateDeviceByToken(fcmToken?: string): Promise<{ status: string; message: string }> {
    const res = await apiClient.delete('/api/v1/common/notifications/devices', {
      data: { fcm_token: fcmToken },
    });
    return res.data?.data ?? res.data;
  },

  // Preferences
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await apiClient.get('/api/v1/common/notifications/preferences');
    return res.data?.data ?? res.data;
  },

  async updatePreferences(payload: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const res = await apiClient.put('/api/v1/common/notifications/preferences', payload);
    return res.data?.data ?? res.data;
  },

  async updatePermissionStatus(
    status: 'granted' | 'denied' | 'dismissed' | 'unsupported'
  ): Promise<NotificationPreferences> {
    const res = await apiClient.post('/api/v1/common/notifications/permission-status', { status });
    return res.data?.data ?? res.data;
  },

  // Fan Notifications (In-App)
  async getFanNotifications(
    page = 1,
    limit = 20,
    unreadOnly = false,
    category?: 'all' | 'creator' | 'admin'
  ): Promise<FanNotificationListResponse> {
    const params: Record<string, unknown> = {
      page,
      limit: Math.min(limit, 20),
      unread_only: unreadOnly,
    };
    if (category && category !== 'all') {
      params.category = category;
    }
    const res = await apiClient.get('/api/v1/fan/notifications', {
      params,
    });
    return res.data?.data ?? res.data;
  },

  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get('/api/v1/fan/notifications/unread');
    const data = res.data?.data ?? res.data;
    return typeof data?.unread_count === 'number' ? data.unread_count : 0;
  },

  async markAsRead(notificationId: number): Promise<{ id: number; is_read: boolean }> {
    const res = await apiClient.patch(`/api/v1/fan/notifications/${notificationId}/read`);
    return res.data?.data ?? res.data;
  },

  async markAllAsRead(): Promise<{ marked_read_count: number }> {
    const res = await apiClient.patch('/api/v1/fan/notifications/read');
    return res.data?.data ?? res.data;
  },

  async deleteNotification(notificationId: number): Promise<{ status: string; message: string }> {
    const res = await apiClient.delete(`/api/v1/fan/notifications/${notificationId}`);
    return res.data?.data ?? res.data;
  },

  // Admin Announcements
  async sendAdminAnnouncement(payload: AdminBulkNotificationRequest): Promise<AdminBulkNotificationResponse> {
    const res = await apiClient.post('/api/v1/admin/notifications', payload);
    return res.data?.data ?? res.data;
  },

  async listAdminAnnouncements(page = 1, limit = 20): Promise<{ items: AdminNotificationHistoryItem[]; total: number }> {
    const res = await apiClient.get('/api/v1/admin/notifications', {
      params: { page, limit },
    });
    return res.data?.data ?? res.data;
  },
};
