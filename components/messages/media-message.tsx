'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { Message } from '@/services/messages';
import { messageService } from '@/services/messages';
import { cn } from '@/lib/utils';
import { Loader2, Play, Volume2, X } from 'lucide-react';

interface MediaMessageProps {
  message: Message;
  mine: boolean;
  apiBaseUrl: string;
}

function resolveDirectUrl(apiBaseUrl: string, mediaUrl: string): string {
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) return mediaUrl;
  return `${apiBaseUrl}${mediaUrl.startsWith('/') ? '' : '/'}${mediaUrl}`;
}

export function MediaMessage({ message: m, mine, apiBaseUrl }: MediaMessageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const mediaUrl = m.media_url || '';
  const needsSigned = useMemo(() => mediaUrl.startsWith('/media/protected/'), [mediaUrl]);
  const directUrl = useMemo(
    () => (mediaUrl ? resolveDirectUrl(apiBaseUrl, mediaUrl) : ''),
    [apiBaseUrl, mediaUrl]
  );

  useEffect(() => {
    let alive = true;
    if (!mediaUrl) return;
    if (!needsSigned) {
      setSignedUrl(null);
      setFailed(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    void messageService
      .getSignedMediaUrl(m.id)
      .then((res) => {
        if (!alive) return;
        setSignedUrl(res.url);
      })
      .catch(() => {
        if (!alive) return;
        setFailed(true);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [m.id, mediaUrl, needsSigned]);

  const urlToUse = needsSigned ? signedUrl || '' : directUrl;
  const thumb = m.media_thumbnail_url
    ? resolveDirectUrl(apiBaseUrl, m.media_thumbnail_url)
    : '';

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          mine
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md border border-border/50'
        )}
      >
        {loading ? (
          <div className="flex items-center gap-2 py-6 px-10 opacity-90">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : failed ? (
          <p className="text-xs text-destructive">Could not load media</p>
        ) : m.message_type === 'image' ? (
          <>
            <button
              type="button"
              className="block"
              onClick={() => setViewerOpen(true)}
              aria-label="Open image viewer"
            >
              <Image
                src={urlToUse}
                alt={m.body || 'Image'}
                width={320}
                height={320}
                unoptimized
                className="rounded-xl max-h-[320px] w-auto h-auto object-contain"
              />
            </button>
            {viewerOpen && urlToUse ? (
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setViewerOpen(false)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="relative max-w-[min(1100px,95vw)] max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-background/90 border border-border shadow flex items-center justify-center"
                    onClick={() => setViewerOpen(false)}
                    aria-label="Close image viewer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <Image
                    src={urlToUse}
                    alt={m.body || 'Image'}
                    width={1200}
                    height={900}
                    unoptimized
                    className="rounded-xl max-h-[90vh] w-auto h-auto object-contain select-none"
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : m.message_type === 'video' ? (
          <>
            <button
              type="button"
              className={cn(
                'rounded-xl border border-border/60 overflow-hidden',
                mine ? 'bg-white/10 text-white' : 'bg-background/60'
              )}
              onClick={() => setVideoOpen(true)}
              aria-label="Open video player"
              disabled={!urlToUse}
            >
              <div
                className={cn(
                  'relative w-[220px] sm:w-[250px] aspect-[9/16] max-h-[360px]',
                  mine ? 'bg-white/10' : 'bg-muted'
                )}
              >
                {thumb && !thumbFailed ? (
                  <Image
                    src={thumb}
                    alt="Video thumbnail"
                    fill
                    className="object-cover"
                    sizes="250px"
                    unoptimized
                    onError={() => setThumbFailed(true)}
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/60" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-14 w-14 rounded-full bg-black/60 border border-white/20 flex items-center justify-center">
                    <Play className="h-7 w-7 text-white" />
                  </div>
                </div>
              </div>
            </button>
            {videoOpen && urlToUse ? (
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setVideoOpen(false)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="relative w-full max-w-[min(1100px,95vw)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-background/90 border border-border shadow flex items-center justify-center"
                    onClick={() => setVideoOpen(false)}
                    aria-label="Close video player"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <video
                    src={urlToUse}
                    controls
                    autoPlay
                    playsInline
                    className="rounded-xl w-full max-h-[85vh] bg-black"
                  />
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <button
              type="button"
              className={cn(
                'w-full rounded-xl border border-border/60 px-4 py-3 flex items-center justify-between gap-3',
                mine ? 'bg-white/10 text-white' : 'bg-background/60'
              )}
              onClick={() => setAudioOpen(true)}
              aria-label="Open audio player"
              disabled={!urlToUse}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', mine ? 'bg-white/15' : 'bg-muted')}>
                  <Volume2 className={cn('h-5 w-5', mine ? 'text-white' : 'text-foreground')} />
                </div>
                <div className="min-w-0 text-left">
                  <p className={cn('text-sm font-semibold leading-tight', mine ? 'text-white' : 'text-foreground')}>
                    Audio message
                  </p>
                  <p className={cn('text-xs truncate', mine ? 'text-white/80' : 'text-muted-foreground')}>
                    Tap to play full screen
                  </p>
                </div>
              </div>
              <span className={cn('text-xs', mine ? 'text-white/80' : 'text-muted-foreground')}>Play</span>
            </button>
            {audioOpen && urlToUse ? (
              <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setAudioOpen(false)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="relative w-full max-w-[min(720px,95vw)] rounded-2xl bg-background border border-border p-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-background border border-border shadow flex items-center justify-center"
                    onClick={() => setAudioOpen(false)}
                    aria-label="Close audio player"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <p className="font-semibold mb-2">Audio message</p>
                  <audio src={urlToUse} controls autoPlay className="w-full" />
                </div>
              </div>
            ) : null}
          </>
        )}

        {m.body?.trim() ? (
          <p className={cn('mt-2 whitespace-pre-wrap break-words', mine ? 'text-white/95' : '')}>
            {m.body}
          </p>
        ) : null}

        <p
          className={cn(
            'text-[10px] mt-1 opacity-80',
            mine ? 'text-right text-white/90' : 'text-left text-muted-foreground'
          )}
        >
          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

