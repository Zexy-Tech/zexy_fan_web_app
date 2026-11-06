import { useQuery, useMutation } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscriptions';
import { useAuthContext } from '@/hooks/useAuth';

export function useCreatorPlans(creatorId: number) {
  return useQuery({
    queryKey: ['creator', creatorId, 'plans'],
    queryFn: () => subscriptionService.getCreatorPlans(creatorId),
    enabled: !!creatorId,
  });
}

export function useMySubscriptions() {
  const { isAuthenticated } = useAuthContext();

  return useQuery({
    queryKey: ['subscriptions', 'my'],
    queryFn: () => subscriptionService.getMySubscriptions(),
    enabled: isAuthenticated,
  });
}

export function useCreateSubscriptionIntent() {
  return useMutation({
    mutationFn: (planId: number) => subscriptionService.createSubscriptionIntent(planId),
  });
}
