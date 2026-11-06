import { useQuery } from '@tanstack/react-query';
import { activityService } from '@/services/activity';

export function useActivity(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: ['activity', page, limit],
    queryFn: () => activityService.getHistory(page, limit),
  });
}
