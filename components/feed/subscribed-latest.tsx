'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useFeed, useCreators } from '@/hooks/useFeed';
import { getMediaUrl } from '@/lib/utils';
import { Lock, Play, Image as ImageIcon, Music } from 'lucide-react';

export function SubscribedLatest() {
  const { data: content, isLoading: isFeedLoading } = useFeed();
  const { data: creators, isLoading: isCreatorsLoading } = useCreators();

  if (isFeedLoading || isCreatorsLoading) return null;

  const subscribedCreatorIds = creators
    ?.filter((c) => c.is_subscribed)
    .map((c) => c.id) || [];

  if (subscribedCreatorIds.length === 0) return null;

  // Get the latest post for each subscribed creator
  // We sort by created_on to ensure we get the actual latest
  const latestPosts = subscribedCreatorIds.map((id) => {
    return content
      ?.filter((c) => c.creator_uid === id)
      .sort((a, b) => new Date(b.created_on).getTime() - new Date(a.created_on).getTime())[0];
  }).filter(Boolean);

  if (latestPosts.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Latest from Subscriptions</h2>
        <Link href="/subscriptions" className="text-xs text-purple-500 font-medium hover:underline">
          View All
        </Link>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {latestPosts.map((post) => (
          <Link 
            key={post!.id} 
            href={`/content/${post!.id}`}
            className="flex-shrink-0 w-[240px] group relative"
          >
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-xl group-hover:border-purple-500/50 transition-all duration-300">
              {/* Thumbnail / Placeholder */}
              <div className="w-full h-full bg-gradient-to-br from-purple-900/20 via-zinc-900 to-pink-900/20 flex items-center justify-center">
                {post!.media?.[0]?.media_type === 'video' ? (
                  <Play className="w-10 h-10 text-purple-500/40" />
                ) : post!.media?.[0]?.media_type === 'audio' ? (
                  <Music className="w-10 h-10 text-purple-500/40" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-purple-500/40" />
                )}
              </div>

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Locked Badge */}
              {post!.is_locked && (
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 scale-90">
                  <Lock className="w-3 h-3 text-purple-400" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Locked</span>
                </div>
              )}

              {/* Creator & Title */}
              <div className="absolute bottom-3 left-3 right-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="relative h-6 w-6 rounded-full border border-white/20 overflow-hidden ring-2 ring-purple-500/20">
                    {post!.creator_avatar ? (
                      <Image
                        src={getMediaUrl(post!.creator_avatar)!}
                        alt={post!.creator_name}
                        fill
                        className="object-cover"
                        sizes="24px"
                      />
                    ) : (
                      <div className="w-full h-full bg-purple-600 flex items-center justify-center text-[10px] font-bold">
                        {post!.creator_name[0]}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-white/90 truncate">
                    {post!.creator_name}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-white line-clamp-1 group-hover:text-purple-400 transition-colors">
                  {post!.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
