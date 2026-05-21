/**
 * Creator Card Component
 * 
 * Displays individual creator information in a card format.
 * Used in the creators grid listing page.
 */

import Image from 'next/image';
import { Creator } from '@/services/feed';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, Radio } from 'lucide-react';
import { cn, getMediaUrl } from '@/lib/utils';

interface CreatorCardProps {
  creator: Creator;
  className?: string;
}

/**
 * Format subscriber count for display
 */
function formatSubscriberCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}

/**
 * Format category slug to display name
 */
function formatCategory(slug: string | null): string | null {
  if (!slug) return null;
  return slug
    .split('_')
    .join(' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Creator card component
 */
export function CreatorCard({ creator, className }: CreatorCardProps) {
  const categoryDisplay = formatCategory(creator.category);

  return (
    <Card className={cn(
      'overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer relative',
      className
    )}>
      <CardContent className="p-0">
        {/* Avatar Section */}
        <div className="relative aspect-square bg-gradient-to-br from-primary/20 to-primary/5">
          {creator.avatar ? (
            <Image
              src={getMediaUrl(creator.avatar) || ''}
              alt={creator.name || creator.username}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, 300px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {creator.name?.charAt(0) || creator.username?.charAt(0) || '?'}
                </span>
              </div>
            </div>
          )}
          
          {/* Status Badges Overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 items-end">
            {creator.is_live && (
              <Badge className="bg-red-500 hover:bg-red-600 text-white animate-pulse border-none">
                <Radio className="w-3 h-3 mr-1" />
                LIVE
              </Badge>
            )}
            {creator.is_subscribed && (
              <Badge className="bg-green-500 hover:bg-green-600 text-white border-none">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Subscribed
              </Badge>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4 space-y-2">
          {/* Name */}
          <h3 className="font-semibold text-lg line-clamp-1">
            {creator.name}
          </h3>
          
          {/* Username */}
          <p className="text-sm text-muted-foreground line-clamp-1">
            @{creator.username}
          </p>
          
          {/* Category Badge */}
          {categoryDisplay && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
              {categoryDisplay}
            </Badge>
          )}
          
          {/* Subscriber Count */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
            <Users className="w-3.5 h-3.5" />
            <span>{formatSubscriberCount(creator.subscriber_count)} subscribers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
