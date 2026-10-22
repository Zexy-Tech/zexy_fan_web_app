'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/hooks/useAuth';
import {
  notificationService,
  type FanNotificationItem,
  type NotificationPreferences,
  type RegisterDevicePayload,
} from '@/services/notifications';
import {
  isFirebaseMessagingSupported,
  getPushSupportDetails,
  detectClientDeviceMetadata,
  requestNotificationPermission,
  getFCMRegistrationToken,
  onForegroundMessageListener,
} from '@/lib/firebase-messaging';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  list: (page: number, limit: number, unreadOnly: boolean, category?: string) =>
    ['notifications', 'list', { page, limit, unreadOnly, category }] as const,
  preferences: ['notifications', 'preferences'] as const,
  devices: ['notifications', 'devices'] as const,
};

// ============================================================================
// HOOKS: IN-APP FAN NOTIFICATIONS
// ============================================================================

export function useUnreadNotificationsCount() {
  const { isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    enabled: Boolean(isAuthenticated),
    refetchInterval: 30000, // Poll every 30 seconds
    staleTime: 10000,
  });
}

export function useFanNotifications(
  page = 1,
  limit = 20,
  unreadOnly = false,
  category: 'all' | 'creator' | 'admin' = 'all'
) {
  const { isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: NOTIFICATION_KEYS.list(page, limit, unreadOnly, category),
    queryFn: () => notificationService.getFanNotifications(page, limit, unreadOnly, category),
    enabled: Boolean(isAuthenticated),
    staleTime: 10000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      toast.success('All notifications marked as read');
    },
    onError: () => {
      toast.error('Failed to mark all as read');
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: number) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
    onError: () => {
      toast.error('Failed to dismiss notification');
    },
  });
}

// ============================================================================
// HOOKS: PREFERENCES & DEVICES
// ============================================================================

export function useNotificationPreferences() {
  const { isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.preferences,
    queryFn: () => notificationService.getPreferences(),
    enabled: Boolean(isAuthenticated),
    staleTime: 60000,
  });

  const mutation = useMutation({
    mutationFn: (payload: Partial<NotificationPreferences>) =>
      notificationService.updatePreferences(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(NOTIFICATION_KEYS.preferences, updated);
      toast.success('Notification preferences updated');
    },
    onError: () => {
      toast.error('Failed to update notification preferences');
    },
  });

  return { ...query, updatePreferences: mutation };
}

export function useUserDevices() {
  const { isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATION_KEYS.devices,
    queryFn: () => notificationService.listDevices(true),
    enabled: Boolean(isAuthenticated),
    staleTime: 30000,
  });

  const deactivateDevice = useMutation({
    mutationFn: (deviceId: number) => notificationService.deactivateDeviceById(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices });
      toast.success('Device unregistered');
    },
    onError: () => {
      toast.error('Failed to unregister device');
    },
  });

  return { ...query, deactivateDevice };
}

// ============================================================================
// HOOK: PUSH NOTIFICATION SETUP & FOREGROUND LISTENER
// ============================================================================

export function usePushNotificationSetup() {
  const { isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isRegistering, setIsRegistering] = useState(false);
  const [supportDetails, setSupportDetails] = useState({
    isSupported: true,
    isIOS: false,
    isStandalone: false,
    needsHomeScreenAdd: false,
  });

  // Check support and current permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const details = getPushSupportDetails();
    setSupportDetails(details);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    } else {
      setPermission('unsupported');
    }
  }, []);

  // Listen for foreground FCM push notifications
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    let unsubscribe: (() => void) | null = null;
    let isCancelled = false;

    async function initListener() {
      const supported = await isFirebaseMessagingSupported();
      if (!supported || isCancelled) return;

      const unsub = await onForegroundMessageListener((payload) => {
        // Invalidate unread queries immediately
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.unreadCount });
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });

        const title = payload.notification?.title || payload.data?.title || 'New Notification';
        const body =
          payload.notification?.body ||
          payload.data?.body ||
          payload.data?.message ||
          '';
        const actionUrl =
          payload.fcmOptions?.link ||
          payload.data?.action_url ||
          payload.data?.click_action;

        // Show foreground in-app toast
        toast(title, {
          description: body,
          action: actionUrl
            ? {
                label: 'View',
                onClick: () => {
                  router.push(actionUrl);
                },
              }
            : undefined,
          duration: 5000,
        });
      });

      if (!isCancelled) {
        unsubscribe = unsub;
      } else if (unsub) {
        unsub();
      }
    }

    void initListener();

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [isAuthenticated, queryClient, router]);

  // Sync pending or existing token on login
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const pendingToken =
      localStorage.getItem('pending_fcm_token') || localStorage.getItem('fcm_device_token');

    if (pendingToken && 'Notification' in window && Notification.permission === 'granted') {
      const deviceMeta = detectClientDeviceMetadata();
      notificationService
        .registerDevice({
          fcm_token: pendingToken,
          platform: deviceMeta.platform,
          browser: deviceMeta.browser,
          device_label: deviceMeta.device_label,
        })
        .then(() => {
          localStorage.removeItem('pending_fcm_token');
          queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices });
          queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences });
        })
        .catch((err) => {
          console.warn('[Push Notifications] Background sync on login error:', err);
        });
    }
  }, [isAuthenticated, queryClient]);

  // Function to register the device token
  const enablePushNotifications = useCallback(async () => {
    const details = getPushSupportDetails();
    if (details.needsHomeScreenAdd) {
      toast.info('On iOS, tap the Share button and select "Add to Home Screen" to receive push notifications.');
      return false;
    }

    setIsRegistering(true);
    try {
      // 1. Request permission
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        if (perm === 'denied') {
          if (isAuthenticated) {
            void notificationService.updatePermissionStatus('denied');
          }
          toast.error('Notification permission was denied. Please update your browser site settings.');
        }
        setIsRegistering(false);
        return false;
      }

      // 2. Fetch FCM token
      const token = await getFCMRegistrationToken();
      if (!token) {
        toast.error('Could not generate notification token. Please check network connection.');
        setIsRegistering(false);
        return false;
      }

      localStorage.setItem('fcm_device_token', token);

      // 3. Register device with backend if authenticated
      if (isAuthenticated) {
        const deviceMeta = detectClientDeviceMetadata();
        const payload: RegisterDevicePayload = {
          fcm_token: token,
          platform: deviceMeta.platform,
          browser: deviceMeta.browser,
          device_label: deviceMeta.device_label,
        };

        await notificationService.registerDevice(payload);

        // Invalidate devices and preferences
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices });
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences });
      } else {
        localStorage.setItem('pending_fcm_token', token);
      }

      toast.success('Push notifications successfully enabled!');
      setIsRegistering(false);
      return true;
    } catch (error) {
      console.error('[Push Notifications] Enable error:', error);
      toast.error('Failed to enable push notifications');
      setIsRegistering(false);
      return false;
    }
  }, [isAuthenticated, queryClient]);

  // Function to disable push notifications
  const disablePushNotifications = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('fcm_device_token');
      await notificationService.deactivateDeviceByToken(storedToken || undefined);
      localStorage.removeItem('fcm_device_token');

      // Update preference toggle to false
      await notificationService.updatePreferences({ push_enabled: false });

      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.devices });
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.preferences });

      toast.success('Push notifications disabled');
      return true;
    } catch (error) {
      console.error('[Push Notifications] Disable error:', error);
      toast.error('Failed to disable push notifications');
      return false;
    }
  }, [queryClient]);

  return {
    permission,
    isRegistering,
    supportDetails,
    enablePushNotifications,
    disablePushNotifications,
  };
}
