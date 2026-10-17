import type { Creator } from '@/services/feed';
import type { ActiveSubscription } from '@/services/subscriptions';

export function fanHasActiveSubscriptionToCreator(
  creator: Pick<Creator, 'id' | 'username'>,
  subscriptions: ActiveSubscription[] | undefined
): boolean {
  if (!subscriptions?.length) return false;
  const handle = creator?.username ? creator.username.toLowerCase() : '';
  const now = Date.now();
  return subscriptions.some((sub) => {
    if (sub.status !== 'active') return false;
    const exp = new Date(sub.expires_at).getTime();
    if (!Number.isFinite(exp) || exp <= now) return false;
    const u = sub.creator_username?.toLowerCase() ?? '';
    return (handle ? u === handle : false) || (creator?.id != null && sub.creator_uid === creator.id);
  });
}

export function isCreatorMemberForFan(options: {
  isAuthenticated: boolean;
  creator: Pick<Creator, 'id' | 'username' | 'is_subscribed'>;
  mySubscriptions: ActiveSubscription[] | undefined;
}): boolean {
  if (!options.isAuthenticated) return false;
  if (options.creator.is_subscribed) return true;
  return fanHasActiveSubscriptionToCreator(options.creator, options.mySubscriptions);
}
