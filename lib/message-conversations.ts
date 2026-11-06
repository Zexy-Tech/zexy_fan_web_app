import type { Conversation, Message } from '@/services/messages';
import { toUserCode } from '@/lib/userCode';

/**
 * Fan /messages/conversations API returns the latest Message per thread (enriched).
 * Map to the list row shape used by the Messages index UI.
 */
export function mapMessageToConversationPreview(
  m: Message,
  currentUserId: number
): Conversation {
  const iAmSender = m.sender_uid === currentUserId;
  const otherId = iAmSender ? m.receiver_uid : m.sender_uid;
  const otherName = iAmSender ? m.receiver_name : m.sender_name;
  const otherUsername = iAmSender ? m.receiver_username : m.sender_username;
  const otherAvatar = iAmSender ? m.receiver_avatar : m.sender_avatar;
  const unread = !iAmSender && !m.read_at ? 1 : 0;

  let preview = m.body?.trim() ?? '';
  if (m.message_type === 'tip_demand') {
    const amt = m.tip_amount != null ? `₹${Number(m.tip_amount).toLocaleString('en-IN')}` : '';
    preview = m.tip_paid ? `Tip sent · ${amt}` : `Tip request · ${amt}`;
  }

  return {
    other_user_id: otherId,
    other_user_code: toUserCode(otherId, 'creator'),
    other_user_name: otherName,
    other_user_username: otherUsername,
    other_user_avatar: otherAvatar,
    last_message: preview || 'Message',
    last_message_at: m.created_at,
    unread_count: unread,
  };
}
