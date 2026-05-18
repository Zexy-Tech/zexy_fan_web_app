'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Play, Image as ImageIcon, Heart, Bookmark } from 'lucide-react';
import { formatDate, getMediaUrl } from '@/lib/utils';
import type { Content } from '@/services/feed';

interface ContentCardProps {
  content: Content;
}

export function ContentCard({ content }: ContentCardProps) {
  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold overflow-hidden">
              {content.creator_avatar ? (
                <Image
                  src={getMediaUrl(content.creator_avatar) || ''}
                  alt={content.creator_name || content.creator_username}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              ) : (
                content.creator_name?.[0] || 'C'
              )}
            </div>
            <div className="flex-1">
              <Link
                href={`/creator/${content.creator_username}`}
                className="font-semibold hover:underline"
              >
                {content.creator_name || content.creator_username}
              </Link>
              <p className="text-xs text-muted-foreground">{formatDate(content.created_on)}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <h3 className="font-semibold mb-2">{content.title}</h3>
          {content.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{content.description}</p>
          )}

          {/* Content Preview/Thumbnail */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {content.is_locked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <Lock className="h-12 w-12 text-white mb-2" />
                <p className="text-white/80 text-sm">Join to view</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {content.media?.[0]?.media_type === 'video' ? (
                  <Play className="h-16 w-16 text-white/80" />
                ) : (
                  <ImageIcon className="h-16 w-16 text-white/80" />
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex flex-col gap-3">
          <div className="flex items-center gap-4 w-full px-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span className="text-xs font-medium">{content.likes_count || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Bookmark className="h-4 w-4" />
              <span className="text-xs font-medium">{content.saves_count || 0}</span>
            </div>
          </div>

          {content.is_locked ? (
            <Link href={`/creator/${content.creator_username}`} className="w-full">
              <Button className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Join to Unlock
              </Button>
            </Link>
          ) : (
            <Link href={`/content/${content.id}`} className="w-full">
              <Button variant="outline" className="w-full">
                View Content
              </Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </>
  );
}
