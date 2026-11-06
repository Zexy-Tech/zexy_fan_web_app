/**
 * React Query hooks for Creator Profile Configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { creatorProfileService } from '@/services/creatorProfile';
import { CreatorProfileConfig } from '@/types/creator-profile';

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

/**
 * Hook to update creator profile configuration
 * 
 * @param creatorId - Creator ID
 * @returns Mutation function and state
 * 
 * @example
 * const { mutate: updateConfig, isPending } = useUpdateProfileConfig(1);
 * updateConfig({ theme: { primaryColor: '#ff0000', ... } });
 */
export function useUpdateProfileConfig(creatorId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: Partial<CreatorProfileConfig>) =>
      creatorProfileService.updateProfileConfig(creatorId, config),
    onSuccess: (data) => {
      // Invalidate all profile config queries
      queryClient.invalidateQueries({
        queryKey: ['creator', 'profile-config'],
      });
      
      // Update specific query cache
      queryClient.setQueryData(
        ['creator', 'profile-config', data.username],
        data
      );
    },
  });
}
