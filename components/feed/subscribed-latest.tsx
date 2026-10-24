'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useFeed, useCreators } from '@/hooks/useFeed';
import { getMediaUrl, cn } from '@/lib/utils';
import { Lock, Play, Image as ImageIcon, Music } from 'lucide-react';
import { Content } from '@/services/feed';

export function SubscribedLatest() {
  const { data: content, isLoading: isFeedLoading } = useFeed();
  const { data: creators, isLoading: isCreatorsLoading } = useCreators();

  const subscribedCreatorIds = useMemo(() => {
    if (!creators) return [];
    return creators.reduce((acc, c) => {
      if (c.is_subscribed) acc.push(c.id);
      return acc;
    }, [] as number[]);
  }, [creators]);

  // Get the latest post for each subscribed creator
  const latestPosts = useMemo(() => {
    if (!content || subscribedCreatorIds.length === 0) return [];
    return subscribedCreatorIds.reduce((acc, id) => {
      const creatorPosts = content.filter((c) => c.creator_uid === id);
      if (creatorPosts.length > 0) {
        const latest = [...creatorPosts].sort((a, b) => 
          new Date(b.created_on).getTime() - new Date(a.created_on).getTime()
        )[0];
        if (latest) acc.push(latest);
      }
      return acc;
    }, [] as Content[]);
  }, [content, subscribedCreatorIds]);

  if (isFeedLoading || isCreatorsLoading) return null;
  if (subscribedCreatorIds.length === 0) return null;
  if (latestPosts.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">Latest from Subscriptions</h2>
        <Link href="/subscriptions" className="text-xs text-purple-500 font-medium hover:underline">
          View All
        </Link>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {latestPosts.map((post) => (
          <Link 
            key={post.id} 
            href={`/content/${post.id}`}
            className="flex-shrink-0 w-[240px] group relative"
          >
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl group-hover:border-purple-500/50">
              {/* Thumbnail / Placeholder */}
              <div className="size-full bg-gradient-to-br from-purple-900/20 via-zinc-900 to-pink-900/20 flex items-center justify-center">
                {(post.thumbnail_url || post.url) ? (
                  <Image
                    src={getMediaUrl(post.thumbnail_url || post.url) || ''}
                    alt={post.title}
                    fill
                    className={cn(
                      "object-cover",
                      post.is_locked && "blur-sm opacity-50"
                    )}
                    sizes="240px"
                  />
                ) : null}
                
                <div className="absolute inset-0 flex items-center justify-center">
                  {post.media?.[0]?.media_type === 'video' ? (
                    <Play className="size-10 text-white/80 drop-shadow-lg" />
                  ) : post.media?.[0]?.media_type === 'audio' ? (
                    <Music className="size-10 text-white/80 drop-shadow-lg" />
                  ) : !post.thumbnail_url && !post.url ? (
                    <ImageIcon className="size-10 text-white/80" />
                  ) : null}
                </div>
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Locked Badge */}
              {post.is_locked && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 scale-90">
                  <Lock className="size-3 text-purple-400" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Locked</span>
                </div>
              )}

              {/* Creator & Title */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="relative size-6 rounded-full border border-white/20 overflow-hidden ring-2 ring-purple-500/20">
                    {post.creator_avatar ? (
                      <Image
                        src={getMediaUrl(post.creator_avatar)!}
                        alt={post.creator_name}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    ) : (
                      <div className="size-full bg-purple-600 flex items-center justify-center text-[10px] font-bold">
                        {post.creator_name[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-white/90 truncate">
                    {post.creator_name}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-purple-400">
                  {post.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
