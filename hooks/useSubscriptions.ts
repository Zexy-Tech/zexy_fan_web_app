import { useQuery, useMutation } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscriptions';
import { queryClient } from '@/lib/queryClient';
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

export function useCancelSubscription() {
  return useMutation({
    mutationFn: (subscriptionId: number) => subscriptionService.cancelSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my'] });
    },
  });
}

export function useCreateSubscriptionIntent() {
  return useMutation({
    mutationFn: (planId: number) => subscriptionService.createSubscriptionIntent(planId),
  });
}

export function useActivateSubscription() {
  return useMutation({
    mutationFn: ({ planId, gatewayOrderId }: { planId: number; gatewayOrderId: string }) =>
      subscriptionService.activateSubscription(planId, gatewayOrderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my'] });
    },
  });
}
