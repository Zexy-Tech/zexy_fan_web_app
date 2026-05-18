'use client';

import { useParams } from 'next/navigation';
import { useContentDetail } from '@/hooks/useContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = parseInt(params.id as string);

  const { data: content, isLoading, error } = useContentDetail(contentId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div className="space-y-6">
      <Link href="/creators">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Creators
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
              {content.creator_name?.[0] || 'C'}
            </div>
            <div className="flex-1">
              <Link
                href={`/creator/${content.creator_username || content.creator_uid}`}
                className="font-semibold hover:underline"
              >
                {content.creator_name || content.creator_username}
              </Link>
              <p className="text-xs text-muted-foreground">{formatDate(content.created_at)}</p>
            </div>
          </div>
          <CardTitle>{content.title}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content Media */}
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {content.is_locked ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                <p className="text-white text-lg font-semibold">Content Locked</p>
                <p className="text-white/80 text-sm">This shouldn't happen - payment required</p>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                {content.type === 'video' ? (
                  <>
                    <Play className="h-16 w-16 text-white/80" />
                    <p className="absolute bottom-4 text-white text-sm">Video Player (Mock)</p>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-16 w-16 text-white/80" />
                    <p className="absolute bottom-4 text-white text-sm">Image Viewer (Mock)</p>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {content.description && (
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{content.description}</p>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-sm font-semibold capitalize">{content.type}</p>
            </div>
            {content.duration_seconds && (
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="text-sm font-semibold">
                  {Math.floor(content.duration_seconds / 60)}:{(content.duration_seconds % 60).toString().padStart(2, '0')}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Visibility</p>
              <p className="text-sm font-semibold capitalize">{content.visibility}</p>
            </div>
            {content.is_paid && (
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="text-sm font-semibold">{formatCurrency(content.price)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
