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
import { Users, CheckCircle2 } from 'lucide-react';
import { cn, getMediaUrl } from '@/lib/utils';

interface CreatorCardProps {
  creator: Creator;
  className?: string;
}

/**
 * Format subscriber count for display
 * 
 * @param count - Subscriber count
 * @returns Formatted string (e.g., "125K", "1.2M")
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
 * Creator card component
 * 
 * @param creator - Creator data
 * @param className - Additional CSS classes
 */
export function CreatorCard({ creator, className }: CreatorCardProps) {
  return (
    <Card className={cn(
      'overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer',
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
                <span className="text-4xl font-bold text-primary">
                  {creator.name?.charAt(0) || creator.username?.charAt(0) || '?'}
                </span>
              </div>
            </div>
          )}
          
          {/* Subscribed Badge */}
          {creator.is_subscribed && (
            <div className="absolute top-2 right-2">
              <Badge className="bg-green-500 hover:bg-green-600 text-white">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Subscribed
              </Badge>
            </div>
          )}
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
          
          {/* Niche Badge */}
          {creator.category && (
            <Badge variant="secondary" className="text-xs">
              {creator.category}
            </Badge>
          )}
          
          {/* Subscriber Count */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground pt-1">
            <Users className="w-4 h-4" />
            <span>{formatSubscriberCount(creator.subscriber_count)} subscribers</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
