'use client';

import Link from 'next/link';
import { useActiveLives } from '@/hooks/useLive';
import { Radio, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { getMediaUrl } from '@/lib/utils';

export function LiveNowSidebar() {
  const { data: lives, isLoading } = useActiveLives();

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!lives || lives.length === 0) {
    return (
      <div className="space-y-3 px-2 py-4">
        <div className="flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Radio className="h-3 w-3" />
          Live Now
        </div>
        <p className="px-2 text-[10px] text-muted-foreground italic">No creators are live right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-2 py-4">
      <div className="flex items-center gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-red-500">
        <Radio className="h-3 w-3 animate-pulse" />
        Live Now
      </div>
      
      <div className="space-y-1">
        {lives.map((live) => (
          <Link
            key={live.id}
            href={`/live/${live.room_id}`}
            className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white/[0.05]"
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-red-500/50">
              {live.creator_avatar ? (
                <Image
                  src={getMediaUrl(live.creator_avatar) || ''}
                  alt={live.creator_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-zinc-800 text-[10px] text-zinc-400">
                  {(live.creator_name || '?').charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-red-500 ring-1 ring-black" />
            </div>
            
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-200">
                {live.creator_name || 'Creator'}
              </p>
              <p className="truncate text-[10px] text-zinc-500">
                @{live.creator_username || 'username'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
