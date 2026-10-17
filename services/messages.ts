import { apiClient } from '@/lib/axios';
import { ENV } from '@/constants/env';
import { sleep } from '@/lib/utils';
import type { CreateIntentResponse } from '@/services/payment';

// ============================================================================
// TYPES
// ============================================================================

export interface Message {
  id: number;
  sender_uid: number;
  receiver_uid: number;
  sender_name: string | null;
  sender_username: string | null;
  sender_avatar: string | null;
  receiver_name: string | null;
  receiver_username: string | null;
  receiver_avatar: string | null;
  body: string;
  message_type: 'text' | 'image' | 'video' | 'audio' | 'tip_demand';
  media_url: string | null;
  media_thumbnail_url?: string | null;
  is_paid: boolean;
  price: number;
  is_unlocked: boolean;
  tip_amount: number | null;
  tip_paid: boolean;
  tip_transaction_id?: number | null;
  created_at: string;
  read_at: string | null;
  is_deleted?: boolean;
}

export interface Conversation {
  other_user_id: number;
  other_user_name: string | null;
  other_user_username: string | null;
  other_user_avatar: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

/** Latest-message rows as returned by the API (same shape as thread messages). */
const MOCK_CONVERSATION_MESSAGES: Message[] = [
  {
    id: 100,
    sender_uid: 2,
    receiver_uid: 1,
    sender_name: 'Mike Chen',
    sender_username: 'creator_two',
    sender_avatar: null,
    receiver_name: 'John Doe',
    receiver_username: 'fan_user',
    receiver_avatar: null,
    body: 'Thanks for subscribing!',
    message_type: 'text',
    media_url: null,
    is_paid: false,
    price: 0,
    is_unlocked: true,
    tip_amount: null,
    tip_paid: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read_at: null,
  },
];

const MOCK_MESSAGES: Message[] = [
  {
    id: 1,
    sender_uid: 2,
    receiver_uid: 1,
    sender_name: 'Mike Chen',
    sender_username: 'creator_two',
    sender_avatar: null,
    receiver_name: 'John Doe',
    receiver_username: 'fan_user',
    receiver_avatar: null,
    body: 'Thanks for subscribing!',
    message_type: 'text',
    media_url: null,
    is_paid: false,
    price: 0,
    is_unlocked: true,
    tip_amount: null,
    tip_paid: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read_at: null,
  },
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const messageService = {
  /** Latest Message per thread (API: GET fan/messages/conversations). */
  getConversations: async (): Promise<Message[]> => {
    const response = await apiClient.get('/api/v1/fan/messages/conversations');
    return response.data.data;
  },

  /**
   * Get message thread with a creator
   */
  getThread: async (creatorId: number): Promise<Message[]> => {
    const response = await apiClient.get(`/api/v1/fan/messages/thread/${creatorId}`);
    return response.data.data;
  },

  /**
   * Send text message
   */
  sendMessage: async (creatorId: number, body: string): Promise<Message> => {
    const response = await apiClient.post('/api/v1/fan/messages/send', {
      receiver_uid: creatorId,
      body,
    });
    return response.data.data;
  },

  /**
   * Mark message as read
   */
  markAsRead: async (messageId: number): Promise<void> => {
    await apiClient.post(`/api/v1/common/messages/${messageId}/read`);
  },

  /**
   * Delete specific message
   */
  deleteMessage: async (messageId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/fan/messages/${messageId}`);
  },

  /**
   * Clear chat history with a creator
   */
  clearChat: async (creatorId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/fan/messages/chat/${creatorId}`);
  },

  /**
   * Upload media for a message
   */
  uploadMedia: async (file: File): Promise<{ url: string; mime_type: string; size_bytes: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/api/v1/fan/messages/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Send media message
   */
  sendMediaMessage: async (creatorId: number, params: { message_type: string; media_url: string; media_mime_type: string; media_size_bytes: number; body?: string }): Promise<Message> => {
    const response = await apiClient.post('/api/v1/fan/messages/send/media', {
      receiver_uid: creatorId,
      ...params,
    });
    return response.data.data;
  },

  /** Signed URL for rendering protected media in a message bubble. */
  getSignedMediaUrl: async (messageId: number): Promise<{ url: string }> => {
    const response = await apiClient.get(`/api/v1/common/messages/${messageId}/signed-media-url`);
    return response.data.data;
  },

  /**
   * Razorpay order intent for paying a creator's tip_demand DM (see POST fan/messages/tip-demands/...).
   */
  createTipDemandIntent: async (messageId: number): Promise<CreateIntentResponse> => {
    const response = await apiClient.post(
      `/api/v1/fan/messages/tip-demands/${messageId}/intents`
    );
    return response.data.data;
  },
};
