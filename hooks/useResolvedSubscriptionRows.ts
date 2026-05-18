'use client';

import { useMemo } from 'react';
import { DEMO_MEMBERSHIP_SUBSCRIPTIONS } from '@/services/subscriptions';
import type { ActiveSubscription } from '@/services/subscriptions';
import { useMySubscriptions } from '@/hooks/useSubscriptions';

export function useResolvedSubscriptionRows() {
  const query = useMySubscriptions();

  const rows = useMemo<ActiveSubscription[]>(
    () => (query.data && query.data.length > 0 ? query.data : DEMO_MEMBERSHIP_SUBSCRIPTIONS),
    [query.data]
  );

  return {
    ...query,
    rows,
    isShowingDemo: !query.data?.length,
  };
}
