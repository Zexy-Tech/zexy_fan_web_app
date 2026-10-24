/**
 * Creator Intro Section
 * 
 * Displays creator greeting, bio, and avatar with customizable styling.
 */

'use client';

import Image from 'next/image';
import { IntroConfig } from '@/types/creator-profile';
import { Creator } from '@/services/feed';
import { getMediaUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio } from 'lucide-react';

interface CreatorIntroSectionProps {
  creator: Creator;
  config: IntroConfig;
  isLive?: boolean;
  onLiveClick?: () => void;
  showSubscribeButton?: boolean;
  onSubscribeClick?: () => void;
  showMessageButton?: boolean;
  onMessageClick?: () => void;
}

/**
 * Intro section component for creator profile
 * 
 * @param creator - Creator data
 * @param config - Intro section configuration
 */
export function CreatorIntroSection({
  creator,
  config,
  isLive = false,
  onLiveClick,
  showSubscribeButton = false,
  onSubscribeClick,
  showMessageButton = false,
  onMessageClick,
}: CreatorIntroSectionProps) {
  const avatarStyleClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  };
  
  return (
    <div className="px-4 py-6 space-y-4">
      {/* Avatar */}
      {config.showAvatar && (
        <div className="flex justify-center">
          <div
            className={`relative size-24 flex items-center justify-center text-white text-lg font-semibold overflow-hidden ${avatarStyleClasses[config.avatarStyle]}`}
            style={{
              background: 'linear-gradient(to bottom right, var(--profile-gradient-start), var(--profile-gradient-end))',
            }}
          >
            {creator.avatar ? (
              <Image
                src={getMediaUrl(creator.avatar) || ''}
                alt={creator.name || creator.username}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              creator.name?.charAt(0) || creator.username?.charAt(0) || '?'
            )}
          </div>
        </div>
      )}
      
      {/* Greeting */}
      <div className="text-center flex flex-col items-center gap-2">
        <h1 className="text-lg font-bold" style={{ color: 'var(--profile-primary)' }}>
          {config.greeting}
        </h1>
        {isLive && (
          <Badge 
            className="bg-red-500 hover:bg-red-600 text-white cursor-pointer px-3 py-1 flex items-center gap-1.5"
            onClick={onLiveClick}
          >
            <Radio className="size-4" />
            LIVE NOW
          </Badge>
        )}
      </div>
      
      {/* Bio */}
      <div className="text-center">
        <p className="text-muted-foreground leading-relaxed">
          {config.bio}
        </p>
      </div>
      
      {/* Stats */}
      <div className="flex justify-center gap-6 pt-2">
        <div className="text-center">
          <p className="text-lg font-bold" style={{ color: 'var(--profile-primary)' }}>
            {creator.subscriber_count.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Subscribers</p>
        </div>
      </div>

      {showSubscribeButton && (
        <Button
          className="w-full h-12 text-sm font-semibold text-white"
          onClick={onSubscribeClick}
          style={{
            background:
              'linear-gradient(to right, var(--profile-gradient-start), var(--profile-gradient-end))',
          }}
        >
          Subscribe
        </Button>
      )}

      {showMessageButton && (
        <Button
          variant="secondary"
          className="w-full h-12 text-sm font-semibold"
          onClick={onMessageClick}
        >
          Message
        </Button>
      )}
    </div>
  );
}
