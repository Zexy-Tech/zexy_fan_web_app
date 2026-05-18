import { useQuery, useMutation } from '@tanstack/react-query';
import { contentService } from '@/services/content';
import { queryClient } from '@/lib/queryClient';

export function useContentDetail(contentId: number) {
  return useQuery({
    queryKey: ['content', contentId],
    queryFn: () => contentService.getContentDetail(contentId),
    enabled: !!contentId,
  });
}

export function useUnlockContent() {
  return useMutation({
    mutationFn: (contentId: number) => contentService.unlockContent(contentId),
    onSuccess: (data) => {
      // Update content detail cache
      queryClient.setQueryData(['content', data.id], data);
      
      // Invalidate feed to show unlocked content
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['creator', data.creator_uid, 'content'] });
    },
  });
}

export function useLikeContent() {
  return useMutation({
    mutationFn: ({ contentId, liked }: { contentId: number; liked: boolean }) =>
      liked ? contentService.likeContent(contentId) : contentService.unlikeContent(contentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content', variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useSaveContent() {
  return useMutation({
    mutationFn: ({ contentId, saved }: { contentId: number; saved: boolean }) =>
      saved ? contentService.saveContent(contentId) : contentService.unsaveContent(contentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['content', variables.contentId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['saved-content'] });
    },
  });
}
