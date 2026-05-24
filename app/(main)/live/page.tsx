'use client';

import Link from 'next/link';
import { useActiveLives } from '@/hooks/useLive';
import { Radio, Loader2, Users, PlayCircle } from 'lucide-react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LiveListingPage() {
  const { data: lives, isLoading, error } = useActiveLives();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Failed to load live sessions. Please try again.
      </div>
    );
  }

  if (!lives || lives.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="bg-zinc-900 size-20 rounded-full flex items-center justify-center mx-auto">
          <Radio className="size-10 text-zinc-600" />
        </div>
        <h2 className="text-lg font-semibold">No one is live right now</h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          Follow your favorite creators to get notified when they go live!
        </p>
        <Link href="/creators" className="inline-block mt-4 text-primary hover:underline font-medium">
          Browse all creators
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold flex items-center gap-2">
          <Radio className="size-6 text-red-500 animate-pulse" />
          Live Now
        </h1>
        <Badge variant="outline" className="text-muted-foreground">
          {lives.length} creator{lives.length === 1 ? '' : 's'} online
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lives.map((live) => (
          <Link key={live.id} href={`/live/${live.room_id}`}>
            <Card className="overflow-hidden bg-zinc-950 border-white/5 hover:border-red-500/30 transition-all group">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-zinc-900">
                  {live.creator_avatar ? (
                    <Image
                      src={getMediaUrl(live.creator_avatar) || ''}
                      alt={live.creator_name}
                      fill
                      className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-zinc-800">
                      {(live.creator_name || '?').charAt(0)}
                    </div>
                  )}
                  
                  {/* Live indicators */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className="bg-red-500 text-white border-none px-2 py-0.5 text-[10px] font-bold">
                      LIVE
                    </Badge>
                    <Badge className="bg-black/60 text-white border-none backdrop-blur-sm px-2 py-0.5 text-[10px] flex items-center gap-1">
                      <Users className="size-3" />
                      {live.viewer_count}
                    </Badge>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-red-500 text-white p-3 rounded-full shadow-xl">
                      <PlayCircle className="size-8" />
                    </div>
                  </div>
                </div>

                <div className="p-4 flex items-center gap-3">
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-red-500/20 bg-zinc-800 flex items-center justify-center">
                    {live.creator_avatar ? (
                      <Image
                        src={getMediaUrl(live.creator_avatar) || ''}
                        alt={live.creator_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-zinc-500">
                        {(live.creator_name || '?').charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate text-zinc-100">{live.creator_name || 'Creator'}</h3>
                    <p className="text-xs text-zinc-500 truncate">@{live.creator_username || 'username'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
