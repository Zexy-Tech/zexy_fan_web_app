'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { CreatorCard } from '@/components/creator-card';
import { useInfiniteCreators } from '@/hooks/useFeed';
import { useCategories } from '@/hooks/useCategories';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { toUserCode } from '@/lib/userCode';

export default function CategoryCreatorsPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  
  const { data: categories } = useCategories();
  const category = categories?.find(c => c.slug === slug);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteCreators({ category: slug });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  // Transform infinite pages into a flat array of creators
  const creators = data?.pages.flatMap((page) => page.items) ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!category && !isLoading && categories) {
    return (
      <div className="-mt-2 py-12 text-center">
        <p className="text-sm text-muted-foreground">Category not found.</p>
        <Link href="/categories" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to Categories
        </Link>
      </div>
    );
  }

  return (
    <div className="-mt-2 space-y-4">
      {category && <p className="text-sm font-medium text-primary mb-4 capitalize">{category.display_name} Creators</p>}
      
      {creators.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No creators in this category yet.</p>
          <Link href="/categories" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Back to Categories
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {creators.map((creator) => (
            <Link key={creator.id} href={`/creator/${creator.username || creator.user_code || toUserCode(creator.id, 'creator')}`} className="block">
              <CreatorCard creator={creator} />
            </Link>
          ))}
        </div>
      )}

      {/* Infinite scroll trigger */}
      {hasNextPage && (
        <div ref={ref} className="py-8 flex justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          ) : (
            <span className="text-sm text-muted-foreground">Load more...</span>
          )}
        </div>
      )}
    </div>
  );
}
