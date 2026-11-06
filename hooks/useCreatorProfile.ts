/**
 * React Query hooks for Creator Profile Configuration
 */

import { useQuery } from '@tanstack/react-query';
import { creatorProfileService } from '@/services/creatorProfile';

/**
 * Hook to fetch creator profile configuration
 * 
 * @param username - Creator username
 * @returns React Query result with profile config data
 * 
 * @example
 * const { data: config, isLoading, error } = useCreatorProfileConfig('creator_one');
 */
export function useCreatorProfileConfig(username: string) {
  return useQuery({
    queryKey: ['creator', 'profile-config', username],
    queryFn: () => creatorProfileService.getProfileConfig(username),
    enabled: !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
