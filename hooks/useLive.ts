import { useQuery } from '@tanstack/react-query';
import { liveService } from '@/services/live';

export function useActiveLives() {
  return useQuery({
    queryKey: ['live', 'active'],
    queryFn: () => liveService.getActiveLives(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
