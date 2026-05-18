'use client';

import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Image as LucideImage,
  Music,
  Package,
  Search,
  Video,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ContentPopup } from '@/components/content-popup';
import { cn, formatCurrency } from '@/lib/utils';

type SavedTabId = 'images' | 'videos' | 'audios' | 'products';

type SavedItem = {
  id: string;
  title: string;
  thumbSrc: string;
  duration?: string;
  videoSrc?: string;
  audioSrc?: string;
  price?: number;
  description?: string;
};

const CONTENT_TABS: { id: SavedTabId; label: string; icon: LucideIcon }[] = [
  { id: 'images', label: 'Images', icon: LucideImage },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'audios', label: 'Audios', icon: Music },
  { id: 'products', label: 'Products', icon: Package },
];

const DEMO_IMAGE_SRCS = [
  '/sample-media/tom.png',
  '/sample-media/id-card-1.png',
  '/sample-media/id-card-2.png',
  '/sample-media/id-card-3.png',
] as const;

const DEMO_SAVED_IMAGES: SavedItem[] = Array.from({ length: 9 }, (_, i) => ({
  id: `saved-img-${i}`,
  thumbSrc: DEMO_IMAGE_SRCS[i % DEMO_IMAGE_SRCS.length],
  title: `Saved image ${i + 1}`,
}));

const DEMO_SAVED_VIDEOS: SavedItem[] = [
  {
    id: 'saved-vid-1',
    title: 'Morning stretch routine',
    duration: '02:18',
    thumbSrc: '/sample-media/id-card-1.png',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'saved-vid-2',
    title: 'Quick HIIT finisher',
    duration: '04:05',
    thumbSrc: '/sample-media/id-card-2.png',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'saved-vid-3',
    title: 'Core workout (no equipment)',
    duration: '03:12',
    thumbSrc: '/sample-media/id-card-3.png',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'saved-vid-4',
    title: 'Cool-down + mobility',
    duration: '01:47',
    thumbSrc: '/sample-media/tom.png',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
];

const DEMO_SAVED_AUDIOS: SavedItem[] = [
  {
    id: 'saved-aud-1',
    title: 'Breathing reset (guided)',
    duration: '05:30',
    thumbSrc: '/sample-media/id-card-1.png',
    audioSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
  {
    id: 'saved-aud-2',
    title: 'Focus track — deep work',
    duration: '12:10',
    thumbSrc: '/sample-media/id-card-2.png',
    audioSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
  {
    id: 'saved-aud-3',
    title: 'Sleep wind-down (calm)',
    duration: '09:45',
    thumbSrc: '/sample-media/id-card-3.png',
    audioSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
  {
    id: 'saved-aud-4',
    title: 'Motivation talk (short)',
    duration: '03:20',
    thumbSrc: '/sample-media/tom.png',
    audioSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
];

const DEMO_SAVED_PRODUCTS: SavedItem[] = [
  {
    id: 'saved-prod-1',
    title: "Men's Grey Checkered Slim Fit Shirt",
    price: 1899,
    thumbSrc: '/sample-products/check-grey-shirt.png',
    description: 'Long-sleeve button-down with a black grid on dark grey fabric.',
  },
  {
    id: 'saved-prod-2',
    title: 'American Eagle Gradient Plaid Flannel Shirt',
    price: 2199,
    thumbSrc: '/sample-products/gradient-plaid-flannel.png',
    description: 'Soft brushed flannel with plaid up top that fades through purple into deep navy.',
  },
  {
    id: 'saved-prod-3',
    title: "Men's Navy Zip-Up Utility Shirt",
    price: 1999,
    thumbSrc: '/sample-products/navy-zip-shirt.png',
    description: 'Navy short-sleeve utility shirt with full front zip.',
  },
  {
    id: 'saved-prod-4',
    title: "Men's Dark Green Mandarin Collar Shirt",
    price: 1799,
    thumbSrc: '/sample-products/mandarin-green-shirt.png',
    description: 'Forest-green shirt with a mandarin collar and button front.',
  },
  {
    id: 'saved-prod-5',
    title: 'Beyours Dusk Blue Shirt',
    price: 1699,
    thumbSrc: '/sample-products/dusk-blue-shirt.png',
    description: 'Long-sleeve dress shirt in Dusk Blue from Beyours.',
  },
  {
    id: 'saved-prod-6',
    title: "Men's Brown Plaid Button-Down Shirt",
    price: 1999,
    thumbSrc: '/sample-products/brown-plaid-shirt.png',
    description: 'Brown and black plaid on breathable cotton feel.',
  },
];

const TAB_ITEMS: Record<SavedTabId, SavedItem[]> = {
  images: DEMO_SAVED_IMAGES,
  videos: DEMO_SAVED_VIDEOS,
  audios: DEMO_SAVED_AUDIOS,
  products: DEMO_SAVED_PRODUCTS,
};

function SavedMediaGrid({
  items,
  isProduct,
  onTileClick,
}: {
  items: SavedItem[];
  isProduct?: boolean;
  onTileClick: (item: SavedItem) => void;
}) {
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
          className="relative aspect-square w-full overflow-hidden bg-zinc-900 p-0"
        >
          {item.duration ? (
            <div className="pointer-events-none absolute right-1 top-1 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
              {item.duration}
            </div>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.thumbSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
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
    src: string;
    title: string;
    description?: string;
    videoSrc?: string;
    audioSrc?: string;
  } | null>(null);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = TAB_ITEMS[activeTab];
    if (!q) return items;
    return items.filter((item) => item.title.toLowerCase().includes(q));
  }, [activeTab, query]);

  const openItem = (item: SavedItem) => {
    if (activeTab === 'audios') {
      setPopup({
        src: item.thumbSrc,
        title: item.title,
        audioSrc: item.audioSrc,
      });
    } else if (activeTab === 'videos') {
      setPopup({
        src: item.thumbSrc,
        title: item.title,
        videoSrc: item.videoSrc,
      });
    } else if (activeTab === 'products') {
      setPopup({
        src: item.thumbSrc,
        title: item.title,
        description: item.description,
      });
    } else {
      setPopup({ src: item.thumbSrc, title: item.title });
    }
  };

  return (
    <div className="-mt-2 space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
                <TabIcon className="h-4 w-4 shrink-0" aria-hidden />
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
            onTileClick={openItem}
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
      />
    </div>
  );
}
