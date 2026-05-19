'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent, TouchEvent } from 'react';
import { X, Heart, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, getMediaUrl, formatCurrency } from '@/lib/utils';
import { contentEngagementService } from '@/services/contentEngagement';
import { VideoPlayer } from '@/components/content/video-player';

export interface ContentPopupProps {
  open: boolean;
  onClose: () => void;
  /** Top-left title (Instagram-style header). */
  title: string;
  imageSrc: string;
  /** Optional: show a playable video instead of an image. */
  videoSrc?: string;
  /** Optional: show a playable audio player (image can still be used as cover). */
  audioSrc?: string;
  imageAlt?: string;
  contentId?: number;
  initialLiked?: boolean;
  initialSaved?: boolean;
  tags?: string[];
  /**
   * Max width of the rounded panel (CSS length).
   * @default 100vw — edge-to-edge on screen
   */
  panelMaxWidth?: string;
  /**
   * Max height of the rounded panel (CSS length).
   * @default min(88dvh, 780px)
   */
  panelMaxHeight?: string;
  /**
   * Panel height (CSS length). Defaults to `panelMaxHeight` so the card fills the peek area.
   * Set shorter/taller without changing max cap by passing both.
   */
  panelHeight?: string;
  /**
   * Border radius of the whole popup card (CSS length).
   * @default 1.25rem
   */
  borderRadius?: string;
  /** Optional extra classes on the panel (layout tweaks only). */
  panelClassName?: string;
  /**
   * Product-style footer row below like/save: description (~70%) + Buy Now (~30%).
   * Omit or leave empty for image-only popups.
   */
  description?: string;
  /** Optional price for products. */
  price?: number;
  /** Is this a product? */
  isProduct?: boolean;
  /** Called when the user taps Buy Now (only shown when `description` is non-empty). */
  onBuyNow?: () => void;
}

const DEFAULT_MAX_W = '100vw';
const DEFAULT_MAX_H = 'min(88dvh, 780px)';
const DEFAULT_RADIUS = '1rem';

/**
 * Instagram-style peek overlay: rounded card, title + close, image, like + save.
 * Adjust size with `panelMaxWidth`, `panelMaxHeight`, `borderRadius`.
 */
export function ContentPopup({
  open,
  onClose,
  title,
  imageSrc,
  videoSrc,
  audioSrc,
  imageAlt = '',
  contentId,
  initialLiked = false,
  initialSaved = false,
  tags = [],
  panelMaxWidth = DEFAULT_MAX_W,
  panelMaxHeight = DEFAULT_MAX_H,
  panelHeight,
  borderRadius = DEFAULT_RADIUS,
  panelClassName,
  description,
  price,
  isProduct = false,
  onBuyNow,
}: ContentPopupProps) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const lastTapRef = useRef(0);

  const panelStyle: CSSProperties = {
    maxWidth: panelMaxWidth,
    width: '100%',
    height: panelHeight ?? panelMaxHeight,
    maxHeight: panelMaxHeight,
    borderRadius,
  };

  useEffect(() => {
    if (!open) return;
    setLiked(initialLiked);
    setSaved(initialSaved);
    setBurstKey(0);
    setDescriptionExpanded(false);
  }, [open, imageSrc, description, videoSrc, audioSrc, initialLiked, initialSaved]);

  const toggleLiked = async () => {
    const next = !liked;
    setLiked(next);
    
    if (isProduct) {
      if (!contentId) return;
      try {
        if (next) await contentEngagementService.likeProduct(contentId);
        else await contentEngagementService.unlikeProduct(contentId);
      } catch {
        setLiked(!next);
      }
      return;
    }

    if (!contentId) return;
    try {
      if (next) await contentEngagementService.like(contentId);
      else await contentEngagementService.unlike(contentId);
    } catch {
      setLiked(!next);
    }
  };

  const toggleSaved = async () => {
    const next = !saved;
    setSaved(next);

    if (isProduct) {
      if (!contentId) return;
      try {
        if (next) await contentEngagementService.saveProduct(contentId);
        else await contentEngagementService.unsaveProduct(contentId);
      } catch {
        setSaved(!next);
      }
      return;
    }

    if (!contentId) return;
    try {
      if (next) await contentEngagementService.save(contentId);
      else await contentEngagementService.unsave(contentId);
    } catch {
      setSaved(!next);
    }
  };

  const triggerDoubleTapLike = () => {
    setLiked(true);
    setBurstKey((k) => k + 1);
  };

  const handleImageDoubleClick = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    triggerDoubleTapLike();
  };

  const handleImageTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      e.preventDefault();
      triggerDoubleTapLike();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const showProductFooter = Boolean(description?.trim());
  const showPostDetails = !onBuyNow && (Boolean(description?.trim()) || tags.length > 0);

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="pointer-events-none absolute inset-0 flex w-full items-center justify-center px-0 py-3 sm:px-0 sm:py-6">
        <div
          className={cn(
            'pointer-events-auto flex min-h-0 max-h-full w-full flex-col overflow-hidden border-x-0 border-white/12 bg-zinc-950 shadow-[0_25px_80px_-12px_rgba(0,0,0,0.85)] sm:border-x',
            panelClassName
          )}
          style={panelStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top: title left, close right */}
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-4">
            <h2 className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-white sm:text-base">
              {title}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-white hover:bg-white/10"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>
          </header>

          {/* Center: media — image/video/audio */}
          <div
            className="relative min-h-0 w-full min-w-0 flex-1 touch-manipulation bg-black"
            onDoubleClick={handleImageDoubleClick}
            onTouchEnd={handleImageTouchEnd}
            role="presentation"
          >
            {videoSrc ? (
              <VideoPlayer
                src={videoSrc}
                poster={imageSrc}
                className="absolute inset-0 h-full w-full"
                autoPlay
              />
            ) : (
              <>
                {imageSrc ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={imageSrc}
                    alt={imageAlt || title}
                    className="absolute inset-0 h-full w-full select-none object-cover object-center"
                    draggable={false}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50">
                    <Music className="h-20 w-20 text-zinc-700 sm:h-24 sm:w-24" strokeWidth={1} />
                  </div>
                )}

                {audioSrc ? (
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-black/55 px-3 py-3 backdrop-blur-sm">
                    <audio src={audioSrc} controls className="w-full" />
                  </div>
                ) : null}
              </>
            )}
            {burstKey > 0 && (
              <div
                key={burstKey}
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                aria-hidden
              >
                <Heart
                  className="animate-content-popup-heart-burst h-24 w-24 fill-red-500 text-red-500 drop-shadow-lg"
                  strokeWidth={0}
                />
              </div>
            )}
          </div>

          {/* Bottom: like/save + details */}
          <footer className="flex shrink-0 flex-col border-t border-white/10">
            <div className="flex items-center justify-between px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full text-white hover:bg-white/10"
                aria-label={liked ? 'Unlike' : 'Like'}
                aria-pressed={liked}
                onClick={toggleLiked}
              >
                <Heart
                  className={cn('h-7 w-7', liked ? 'fill-red-500 text-red-500' : 'fill-transparent')}
                  strokeWidth={liked ? 0 : 1.75}
                />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-full text-white hover:bg-white/10"
                aria-label={saved ? 'Remove from saved' : 'Save'}
                aria-pressed={saved}
                onClick={toggleSaved}
              >
                <Bookmark
                  className={cn('h-7 w-7', saved && 'fill-white text-white')}
                  strokeWidth={saved ? 0 : 1.75}
                />
              </Button>
            </div>

            {showPostDetails ? (
              <div className="space-y-2 border-t border-white/10 px-4 pb-3 pt-2">
                {description?.trim() ? (
                  <button
                    type="button"
                    onClick={() => setDescriptionExpanded((v) => !v)}
                    className={cn(
                      'w-full bg-transparent p-0 text-left text-xs leading-snug text-zinc-300 outline-none ring-offset-zinc-950 transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-pink-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                      descriptionExpanded
                        ? 'max-h-28 cursor-pointer overflow-y-auto'
                        : 'line-clamp-2 cursor-pointer'
                    )}
                    aria-expanded={descriptionExpanded}
                  >
                    {description.trim()}
                  </button>
                ) : null}

                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-zinc-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {showProductFooter && onBuyNow ? (
              <div className="flex flex-col gap-2 border-t border-white/10 px-4 pb-3 pt-3">
                {price !== undefined && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Price</span>
                    <span className="text-sm font-bold text-pink-500">{formatCurrency(price)}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <div className="min-w-0 flex-[7]">
                    <button
                      type="button"
                      onClick={() => setDescriptionExpanded((v) => !v)}
                      className={cn(
                        'w-full bg-transparent p-0 text-left text-xs leading-snug text-zinc-400 outline-none ring-offset-zinc-950 transition-colors',
                        'focus-visible:ring-2 focus-visible:ring-pink-500/80 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
                        descriptionExpanded
                          ? 'max-h-28 cursor-pointer overflow-y-auto hover:text-zinc-300'
                          : 'line-clamp-2 cursor-pointer hover:text-zinc-300'
                      )}
                      aria-expanded={descriptionExpanded}
                      aria-label={
                        descriptionExpanded ? 'Collapse product description' : 'Expand product description'
                      }
                    >
                      {description?.trim()}
                    </button>
                  </div>
                  <div className="flex min-w-0 flex-[3] items-center">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-auto min-h-9 w-full whitespace-normal px-2 py-2 text-center text-xs font-semibold leading-tight"
                      onClick={() => onBuyNow?.()}
                    >
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </footer>
        </div>
      </div>
    </div>
  );
}
