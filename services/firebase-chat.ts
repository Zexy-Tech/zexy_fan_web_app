import { collection, query, orderBy, limit, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { getFirestoreDb } from '@/lib/firebase';
import type { Message } from './messages';

export function getThreadId(uid1: number, uid2: number): string {
  const smaller = Math.min(uid1, uid2);
  const larger = Math.max(uid1, uid2);
  return `${smaller}_${larger}`;
}

/**
 * Subscribes to real-time chat messages between fan and creator in Firestore.
 * Path: `chats/{threadId}/messages`
 */
export function subscribeToThread(
  currentUid: number,
  otherUid: number,
  onUpdate: (messages: Message[]) => void,
  onError?: (error: Error) => void,
  limitCount = 100
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const threadId = getThreadId(currentUid, otherUid);
    const messagesRef = collection(db, 'chats', threadId, 'messages');
    const q = query(messagesRef, orderBy('created_at', 'asc'), limit(limitCount));

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          msgs.push({
            id: Number(data.id || doc.id),
            sender_uid: Number(data.sender_uid),
            receiver_uid: Number(data.receiver_uid),
            sender_name: data.sender_name ?? null,
            sender_username: data.sender_username ?? null,
            sender_avatar: data.sender_avatar ?? null,
            receiver_name: data.receiver_name ?? null,
            receiver_username: data.receiver_username ?? null,
            receiver_avatar: data.receiver_avatar ?? null,
            body: data.body ?? '',
            message_type: data.message_type || 'text',
            media_url: data.media_url ?? null,
            media_thumbnail_url: data.media_thumbnail_url ?? null,
            is_paid: Boolean(data.is_paid),
            price: Number(data.price || 0),
            is_unlocked: Boolean(data.is_unlocked),
            tip_amount: data.tip_amount != null ? Number(data.tip_amount) : null,
            tip_paid: Boolean(data.tip_paid),
            tip_transaction_id: data.tip_transaction_id != null ? Number(data.tip_transaction_id) : null,
            created_at: data.created_at || new Date().toISOString(),
            read_at: data.read_at ?? null,
            is_deleted: Boolean(data.is_deleted),
          });
        });
        onUpdate(msgs);
      },
      (error) => {
        if (onError) onError(error);
        else console.warn('[Firestore] subscribeToThread error:', error);
      }
    );
  } catch (err) {
    if (onError && err instanceof Error) onError(err);
    return null;
  }
}

/**
 * Subscribes to the user's conversation inbox previews in Firestore.
 * Path: `user_inboxes/{uid}/conversations`
 */
export function subscribeToConversations(
  currentUid: number,
  onUpdate: (conversations: Message[]) => void,
  onError?: (error: Error) => void
): Unsubscribe | null {
  const db = getFirestoreDb();
  if (!db) return null;

  try {
    const inboxRef = collection(db, 'user_inboxes', currentUid.toString(), 'conversations');
    const q = query(inboxRef, orderBy('updated_at', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const convos: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const msg = data.last_message || data;
          if (msg) {
            convos.push({
              id: Number(msg.id || doc.id),
              sender_uid: Number(msg.sender_uid),
              receiver_uid: Number(msg.receiver_uid),
              sender_name: msg.sender_name ?? null,
              sender_username: msg.sender_username ?? null,
              sender_avatar: msg.sender_avatar ?? null,
              receiver_name: msg.receiver_name ?? null,
              receiver_username: msg.receiver_username ?? null,
              receiver_avatar: msg.receiver_avatar ?? null,
              body: msg.body ?? '',
              message_type: msg.message_type || 'text',
              media_url: msg.media_url ?? null,
              media_thumbnail_url: msg.media_thumbnail_url ?? null,
              is_paid: Boolean(msg.is_paid),
              price: Number(msg.price || 0),
              is_unlocked: Boolean(msg.is_unlocked),
              tip_amount: msg.tip_amount != null ? Number(msg.tip_amount) : null,
              tip_paid: Boolean(msg.tip_paid),
              tip_transaction_id: msg.tip_transaction_id != null ? Number(msg.tip_transaction_id) : null,
              created_at: msg.created_at || new Date().toISOString(),
              read_at: msg.read_at ?? null,
              is_deleted: Boolean(msg.is_deleted),
            });
          }
        });
        onUpdate(convos);
      },
      (error) => {
        if (onError) onError(error);
        else console.warn('[Firestore] subscribeToConversations error:', error);
      }
    );
  } catch (err) {
    if (onError && err instanceof Error) onError(err);
    return null;
  }
}
