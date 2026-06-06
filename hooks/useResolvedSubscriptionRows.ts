'use client';

import { useMemo } from 'react';
import type { ActiveSubscription } from '@/services/subscriptions';
import { useMySubscriptions } from '@/hooks/useSubscriptions';

export function useResolvedSubscriptionRows() {
  const query = useMySubscriptions();

  const rows = useMemo<ActiveSubscription[]>(() => query.data || [], [query.data]);

  return {
    ...query,
    rows,
    isShowingDemo: false,
  };
}
