'use client';

import { useParams } from 'next/navigation';
import { useContentDetail, useLikeContent, useSaveContent } from '@/hooks/useContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Heart, Bookmark, MessageCircle, Share2 } from 'lucide-react';
import { formatCurrency, formatDate, cn, getMediaUrl } from '@/lib/utils';
import { toUserCode } from '@/lib/userCode';
import Link from 'next/link';
import Image from 'next/image';
import { VideoPlayer } from '@/components/content/video-player';

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = parseInt(params.id as string);

  const { data: content, isLoading, error } = useContentDetail(contentId);
  const likeMutation = useLikeContent();
  const saveMutation = useSaveContent();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load content</p>
      </div>
    );
  }

  const isVideo = content.type === 'video' || content.media?.[0]?.media_type === 'video';

  return (
    <div className="space-y-6">
      <Link href="/creators">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 size-4" />
          Back to Creators
        </Button>
      </Link>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden relative">
              {content.creator_avatar ? (
                <Image 
                  src={getMediaUrl(content.creator_avatar) || ''} 
                  alt={content.creator_name || ''} 
                  fill
                  className="object-cover"
                />
              ) : (                content.creator_name?.[0] || 'C'
              )}
            </div>
            <div className="flex-1">
              <Link
                href={`/creator/${content.creator_username || content.creator_user_code || toUserCode(content.creator_uid, 'creator')}`}
                className="font-semibold hover:underline"
              >
                {content.creator_name || content.creator_username}
              </Link>
              <p className="text-xs text-muted-foreground">{formatDate(content.created_on)}</p>
            </div>
          </div>
          <CardTitle>{content.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content Media */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden border border-border/50 shadow-inner">
            {content.is_locked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                <div className="p-4 bg-white/10 rounded-full mb-4">
                   <Bookmark className="size-10 text-white animate-pulse" />
                </div>
                <p className="text-white text-lg font-semibold mb-1">Content Locked</p>
                <p className="text-white/60 text-sm max-w-[200px] text-center">Please join this creator to unlock this premium content.</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                {isVideo ? (
                  <VideoPlayer 
                    src={getMediaUrl(content.url) || ''} 
                    poster={getMediaUrl(content.thumbnail_url) || undefined}
                    className="w-full h-full"
                  />
                ) : (
                  <Image
                    src={getMediaUrl(content.url) || ''}
                    alt={content.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain"
                  />
                )}
              </div>
            )}
          </div>

          {/* Engagement Bar */}
          <div className="flex items-center gap-6 py-2 border-t border-b border-border/40">
            <Button
              variant="ghost"
              size="sm"
              className={cn("flex items-center gap-2 transition-colors", content.is_liked && "text-pink-500 hover:text-pink-600")}
              onClick={() => likeMutation.mutate({ contentId: content.id, liked: !content.is_liked })}
              disabled={likeMutation.isPending}
            >
              <Heart className={cn("size-5", content.is_liked && "fill-current")} />
              <span className="font-semibold">{content.likes_count || 0}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn("flex items-center gap-2 transition-colors", content.is_saved && "text-blue-500 hover:text-blue-600")}
              onClick={() => saveMutation.mutate({ contentId: content.id, saved: !content.is_saved })}
              disabled={saveMutation.isPending}
            >
              <Bookmark className={cn("size-5", content.is_saved && "fill-current")} />
              <span className="font-semibold">{content.saves_count || 0}</span>
            </Button>

            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <MessageCircle className="size-5" />
              <span className="font-semibold">0</span>
            </Button>

            <div className="flex-1" />

            <Button variant="ghost" size="icon" className="hover:bg-accent/50">
              <Share2 className="size-5" />
            </Button>
          </div>

          {/* Description */}
          {content.description && (
            <div className="pt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
              <p className="text-sm leading-relaxed">{content.description}</p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 pt-6 border-t border-border/30">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Type</p>
              <p className="text-sm font-medium capitalize">{isVideo ? 'Video' : 'Image'}</p>
            </div>
            {content.duration_seconds && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Duration</p>
                <p className="text-sm font-medium">
                  {Math.floor(content.duration_seconds / 60)}:{(content.duration_seconds % 60).toString().padStart(2, '0')}
                </p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Visibility</p>
              <p className="text-sm font-medium capitalize">{content.visibility}</p>
            </div>
            {content.is_paid && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Price</p>
                <p className="text-sm font-medium text-primary">{formatCurrency(content.price || 0)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
