'use client';

import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Image as LucideImage,
  Loader2,
  Music,
  Package,
  Search,
  Video,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ContentPopup } from '@/components/content-popup';
import { cn, formatCurrency, formatDuration, getMediaUrl } from '@/lib/utils';
import { useSavedContent, useSavedProducts } from '@/hooks/useContent';
import type { Content, Product } from '@/services/feed';

type SavedTabId = 'images' | 'videos' | 'audios' | 'products';

type SavedItem = {
  id: string;
  contentId: number;
  title: string;
  thumbSrc: string;
  duration?: string;
  videoSrc?: string;
  audioSrc?: string;
  price?: number;
  description?: string;
  isLiked: boolean;
  isSaved: boolean;
  tags?: string[];
};

const CONTENT_TABS: { id: SavedTabId; label: string; icon: LucideIcon }[] = [
  { id: 'images', label: 'Images', icon: LucideImage },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'audios', label: 'Audios', icon: Music },
  { id: 'products', label: 'Products', icon: Package },
];

function SavedMediaGrid({
  items,
  isProduct,
  isAudio,
  isVideo,
  onTileClick,
  isLoading,
}: {
  items: SavedItem[];
  isProduct?: boolean;
  isAudio?: boolean;
  isVideo?: boolean;
  onTileClick: (item: SavedItem) => void;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">Nothing saved in this tab yet.</p>
    );
  }

  return (
    <div className="grid w-full grid-cols-3 gap-0">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onTileClick(item)}
          className="relative aspect-square w-full overflow-hidden bg-muted p-0"
        >
          {item.duration ? (
            <div className="pointer-events-none absolute right-1 top-1 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
              {item.duration}
            </div>
          ) : null}

          {isAudio && !item.thumbSrc ? (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Music className="size-8 text-muted-foreground sm:h-10 sm:w-10" strokeWidth={1.5} />
            </div>
          ) : isVideo && !item.thumbSrc ? (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Video className="size-8 text-muted-foreground sm:h-10 sm:w-10" strokeWidth={1.5} />
            </div>
          ) : item.thumbSrc ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.thumbSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <LucideImage className="size-8 text-muted-foreground sm:h-10 sm:w-10" strokeWidth={1.5} />
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pb-1.5 pt-6">
            <p className="line-clamp-2 text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">
              {item.title}
            </p>
            {isProduct && item.price != null ? (
              <p className="mt-0.5 text-center text-[8px] font-semibold text-zinc-200 sm:text-[9px]">
                {formatCurrency(item.price)}
              </p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  );
}

export function SavedContentView() {
  const [activeTab, setActiveTab] = useState<SavedTabId>('images');
  const [query, setQuery] = useState('');
  const [popup, setPopup] = useState<{
    id: number;
    src: string;
    title: string;
    description?: string;
    videoSrc?: string;
    audioSrc?: string;
    isLiked: boolean;
    isSaved: boolean;
    tags?: string[];
    price?: number;
  } | null>(null);

  const contentTypeMap: Record<string, 'image' | 'video' | 'audio'> = {
    images: 'image',
    videos: 'video',
    audios: 'audio',
  };

  const isProductTab = activeTab === 'products';
  const contentFilter = isProductTab ? undefined : contentTypeMap[activeTab];

  const { data: contentData, isLoading: isContentLoading } = useSavedContent(contentFilter);
  const { data: productData, isLoading: isProductLoading } = useSavedProducts();

  const isLoading = isProductTab ? isProductLoading : isContentLoading;

  const allItems = useMemo(() => {
    if (isProductTab) {
      return (productData || []).map(
        (p: Product): SavedItem => ({
          id: String(p.id),
          contentId: p.id,
          title: p.name,
          thumbSrc: getMediaUrl(p.image_urls?.[0]) || '',
          price: p.price,
          description: p.description,
          isLiked: p.is_liked,
          isSaved: true,
        })
      );
    }
    return (contentData || []).map(
      (c: Content): SavedItem => {
        const isAudio = c.type === 'audio' || c.media.some((m) => m.media_type === 'audio');
        const isVideo = c.type === 'video' || c.media.some((m) => m.media_type === 'video');
        const thumbUrl = c.thumbnail_url || c.media.find(m => m.media_type === 'image')?.url;
        
        return {
          id: String(c.id),
          contentId: c.id,
          title: c.title,
          thumbSrc: getMediaUrl(thumbUrl) || '',
          duration: formatDuration(c.duration_seconds),
          videoSrc: isVideo ? getMediaUrl(c.url || c.media.find(m => m.media_type === 'video')?.url) || undefined : undefined,
          audioSrc: isAudio ? getMediaUrl(c.url || c.media.find(m => m.media_type === 'audio')?.url) || undefined : undefined,
          description: c.description || undefined,
          isLiked: c.is_liked,
          isSaved: true,
          tags: c.tags,
        };
      }
    );
  }, [isProductTab, productData, contentData]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allItems;
    return allItems.filter((item) => item.title.toLowerCase().includes(q));
  }, [allItems, query]);

  const openItem = (item: SavedItem) => {
    setPopup({
      id: item.contentId,
      src: item.thumbSrc,
      title: item.title,
      description: item.description,
      videoSrc: item.videoSrc,
      audioSrc: item.audioSrc,
      isLiked: item.isLiked,
      isSaved: item.isSaved,
      tags: item.tags,
      price: item.price,
    });
  };

  return (
    <div className="-mt-2 space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search saved…"
          className="pl-9"
          aria-label="Search saved content"
        />
      </div>

      <Card className="overflow-hidden rounded-2xl p-0 shadow-sm">
        <div className="grid w-full grid-cols-4 border-b">
          {CONTENT_TABS.map(({ id, label, icon: TabIcon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={cn(
                  'flex w-full flex-col items-center justify-center gap-1 px-1 py-2.5 text-xs font-medium transition-colors sm:flex-row sm:gap-1.5 sm:px-2 sm:text-sm',
                  active
                    ? 'border-b-2 border-pink-500 text-foreground'
                    : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <TabIcon className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>

        {query.trim() && filteredItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No saved items match your search.</p>
        ) : (
          <SavedMediaGrid
            items={filteredItems}
            isProduct={activeTab === 'products'}
            isAudio={activeTab === 'audios'}
            isVideo={activeTab === 'videos'}
            onTileClick={openItem}
            isLoading={isLoading}
          />
        )}
      </Card>

      <ContentPopup
        open={popup !== null}
        onClose={() => setPopup(null)}
        title={popup?.title ?? ''}
        imageSrc={popup?.src ?? ''}
        imageAlt={popup?.title ?? ''}
        videoSrc={popup?.videoSrc}
        audioSrc={popup?.audioSrc}
        description={popup?.description}
        contentId={popup?.id}
        initialLiked={popup?.isLiked}
        initialSaved={popup?.isSaved}
        tags={popup?.tags}
        price={popup?.price}
        isProduct={activeTab === 'products'}
      />
    </div>
  );
}
