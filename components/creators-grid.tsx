/**
 * Creators Grid Component
 * 
 * Displays a grid of creator cards with loading and error states.
 */

'use client';

import Link from 'next/link';
import { Creator } from '@/services/feed';
import { CreatorCard } from '@/components/creator-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyStatePlaceholder } from '@/components/ui/empty-state-placeholder';
import { AlertCircle, Users } from 'lucide-react';

interface CreatorsGridProps {
  creators?: Creator[];
  isLoading: boolean;
  error: Error | null;
  refetch?: () => void;
}

/**
 * Skeleton loader for creator cards
 */
function CreatorCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Avatar skeleton */}
        <div className="aspect-square bg-muted animate-pulse" />
        
        {/* Info skeleton */}
        <div className="p-4 space-y-2">
          <div className="h-6 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
          <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Creators grid component
 * 
 * @param creators - Array of creators to display
 * @param isLoading - Loading state
 * @param error - Error object if fetch failed
 * @param refetch - Function to retry fetching
 */
export function CreatorsGrid({ creators, isLoading, error, refetch }: CreatorsGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CreatorCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Failed to load creators</h3>
              <p className="text-sm text-muted-foreground">
                {error.message || 'An unexpected error occurred'}
              </p>
            </div>
            {refetch && (
              <Button onClick={refetch} variant="outline">
                Try again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (!creators || creators.length === 0) {
    return (
      <EmptyStatePlaceholder
        icon={Users}
        title="No creators found"
        description="Try updating your search or filters."
      />
    );
  }

  // Success state - render grid
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {creators.map((creator) => (
        <Link
          key={creator.id}
          href={`/creator/${creator.username}`}
          className="block"
        >
          <CreatorCard creator={creator} />
        </Link>
      ))}
    </div>
  );
}
