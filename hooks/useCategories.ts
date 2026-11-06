import { useQuery } from '@tanstack/react-query';
import { categoriesService } from '@/services/categories';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesService.getCategories(),
    staleTime: 60 * 60_000, // 1 hour
  });
}
