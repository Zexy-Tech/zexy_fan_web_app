/**
 * Creators Listing Page
 * 
 * Public page displaying all available creators.
 * Mobile-only (desktop users are blocked).
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteCreators } from '@/hooks/useFeed';
import { CreatorsGrid } from '@/components/creators-grid';
import { CreatorSearchFilters } from '@/components/creator-search-filters';
import { Loader2 } from 'lucide-react';
import { Creator, CreatorFilters } from '@/services/feed';

export default function CreatorsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [filters, setFilters] = useState<CreatorFilters>({});
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    data,
    isLoading,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteCreators(filters);

  const creators: Creator[] = useMemo(() => {
    const pages = data?.pages ?? [];
    const dedupe = new Map<number, Creator>();

    for (const page of pages) {
      for (const creator of page.items) {
        dedupe.set(creator.id, creator);
      }
    }

    return Array.from(dedupe.values());
  }, [data]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting;
        if (isVisible && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleFiltersChange = useCallback((nextFilters: CreatorFilters) => {
    setFilters(nextFilters);
  }, []);
  
  // Show loading while checking device
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Render creators grid for mobile/tablet users
  return (
    <div className="bg-background">
      {/* Creators Grid */}
      <div className="container mx-auto px-4 py-6">
        

        <div className="mb-5">
          <CreatorSearchFilters
            creators={creators}
            resultCount={creators.length}
            onFiltersChange={handleFiltersChange}
          />
        </div>

        <CreatorsGrid
          creators={creators}
          isLoading={isLoading}
          error={error as Error | null}
          refetch={refetch}
        />

        {!isLoading && creators.length > 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {isFetchingNextPage && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                <span>Loading more creators…</span>
              </div>
            )}
            {!isFetchingNextPage && hasNextPage && <span>Scroll to load more</span>}
            {!hasNextPage && <span aria-label="End of list">•</span>}
          </div>
        )}

        <div ref={loadMoreRef} className="h-2 w-full" />
      </div>
      
    </div>
  );
}
