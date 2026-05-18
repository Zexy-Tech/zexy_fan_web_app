/**
 * LinkMe-style public creator profile view (mobile-first).
 *
 * Target UI:
 * - Full-bleed cover photo at top
 * - Cover fades/collapses while scrolling
 * - Sticky header appears with name/@username + social icons
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCreatorByUsername } from '@/hooks/useFeed';
import { useCreatorProfileConfig } from '@/hooks/useCreatorProfile';
import { useCreatorPlans, useMySubscriptions } from '@/hooks/useSubscriptions';
import { useAuthContext } from '@/hooks/useAuth';
import { cn, formatCurrency, getMediaUrl } from '@/lib/utils';
import { isCreatorMemberForFan } from '@/lib/creatorMembership';
import { queryClient } from '@/lib/queryClient';
import { getDemoCreatorMembershipPlans } from '@/services/subscriptions';
import { Card, CardContent } from '@/components/ui/card';
import { useActionButton } from '@/hooks/useActionButton';
import { SignupModal } from '@/components/auth/signup-modal';
import { MembershipPopup } from '@/components/membership-popup';
import { ContentPopup } from '@/components/content-popup';
import type { ActionButton } from '@/types/creator-profile';
import type { LucideIcon } from 'lucide-react';
import {
  Instagram,
  Facebook,
  Youtube,
  Loader2,
  ExternalLink,
  Menu,
  X,
  Users,
  CreditCard,
  MessageCircle,
  User,
  Image as LucideImage,
  Package,
  Video,
  Music,
  Send,
  AtSign,
  Flag,
  Globe,
  Linkedin,
  MessageSquare,
  HelpCircle,
  Flame,
  PlayCircle,
  Ghost,
} from 'lucide-react';
import { toast } from 'sonner';

interface LinkMeCreatorProfileProps {
  username: string;
}

type SocialKind = 
  | 'instagram' | 'facebook' | 'x' | 'youtube' | 'link' | 'zexy'
  | 'snapchat' | 'telegram' | 'threads' | 'facebook_page' | 'website' 
  | 'linkedin' | 'reddit' | 'discord' | 'quora' | 'takatak' | 'chingari' | 'josh';

function inferSocialKind(url: string): SocialKind | null {
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('facebook.com') || u.includes('fb.com')) {
      if (u.includes('pages')) return 'facebook_page';
      return 'facebook';
  }
  if (u.includes('twitter.com') || u.includes('x.com')) return 'x';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('snapchat.com')) return 'snapchat';
  if (u.includes('t.me')) return 'telegram';
  if (u.includes('threads.net')) return 'threads';
  if (u.includes('linkedin.com')) return 'linkedin';
  if (u.includes('reddit.com')) return 'reddit';
  if (u.includes('discord.')) return 'discord';
  if (u.includes('quora.com')) return 'quora';
  if (u.includes('takatak')) return 'takatak';
  if (u.includes('chingari')) return 'chingari';
  if (u.includes('josh')) return 'josh';
  if (u.startsWith('http')) return 'website';
  return null;
}

function SocialIcon({ kind }: { kind: SocialKind }) {
  switch (kind) {
    case 'instagram': return <Instagram className="h-5 w-5 text-[#E1306C]" />;
    case 'facebook': return <Facebook className="h-5 w-5 text-[#1877F2]" />;
    case 'facebook_page': return <Flag className="h-5 w-5 text-[#1877F2]" />;
    case 'x':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-black">
          <path d="M18.901 1.153h3.68l-8.039 9.189L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932Zm-1.29 19.493h2.039L6.486 3.24H4.298L17.611 20.646Z" />
        </svg>
      );
    case 'youtube': return <Youtube className="h-5 w-5 text-[#FF0000]" />;
    case 'snapchat': return <Ghost className="h-5 w-5 text-[#FFFC00]" />;
    case 'telegram': return <Send className="h-5 w-5 text-[#0088cc]" />;
    case 'threads': return <AtSign className="h-5 w-5 text-black" />;
    case 'website': return <Globe className="h-5 w-5 text-zinc-600" />;
    case 'linkedin': return <Linkedin className="h-5 w-5 text-[#0a66c2]" />;
    case 'reddit': return <MessageSquare className="h-5 w-5 text-[#ff4500]" />;
    case 'discord': return <MessageSquare className="h-5 w-5 text-[#5865f2]" />;
    case 'quora': return <HelpCircle className="h-5 w-5 text-[#b92b27]" />;
    case 'takatak': return <Video className="h-5 w-5 text-pink-500" />;
    case 'chingari': return <Flame className="h-5 w-5 text-orange-500" />;
    case 'josh': return <PlayCircle className="h-5 w-5 text-red-500" />;
    case 'link': return <ExternalLink className="h-5 w-5 text-black" />;
    case 'zexy':
      return (
        <Image
          src="/zexy_z_letter_logo_nobg.png"
          alt="Zexy"
          width={20}
          height={20}
          className="h-5 w-5 object-contain"
        />
      );
  }
}

type SocialEntry = {
  kind: SocialKind;
  button?: ActionButton;
};

function buildFixedSocialRow(actionButtons: ActionButton[] | undefined): SocialEntry[] {
  const links =
    actionButtons?.filter((b) => b.type === 'custom_link' && typeof b.action === 'string') ?? [];

  const pick = (kind: SocialKind) =>
    links.find((b) => inferSocialKind(b.action) === kind);

  const platforms: SocialKind[] = [
    'instagram', 'youtube', 'facebook', 'facebook_page', 'x', 
    'snapchat', 'telegram', 'threads', 'website', 'linkedin', 
    'reddit', 'discord', 'quora', 'takatak', 'chingari', 'josh'
  ];

  const result: SocialEntry[] = platforms
    .map(kind => ({ kind, button: pick(kind) }))
    .filter(entry => !!entry.button);
  
  // Zexy icon always present at the end
  result.push({ kind: 'zexy' });

  return result;
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

type ContentTabId = 'images' | 'videos' | 'audios' | 'products';

const CONTENT_TABS: { id: ContentTabId; label: string; icon: LucideIcon }[] = [
  { id: 'images', label: 'Images', icon: LucideImage },
  { id: 'videos', label: 'Videos', icon: Video },
  { id: 'audios', label: 'Audios', icon: Music },
  { id: 'products', label: 'Products', icon: Package },
];

/** Local demo assets only (Images tab). Not used for hero / cover — those stay on creator API. */
const DEMO_PROFILE_IMAGE_SRCS = [
  '/sample-media/tom.png',
  '/sample-media/id-card-1.png',
  '/sample-media/id-card-2.png',
  '/sample-media/id-card-3.png',
] as const;

const DEMO_IMAGES_GRID_COUNT = 9;

const DEMO_VIDEOS: readonly {
  id: string;
  title: string;
  duration: string;
  thumbSrc: string;
  videoSrc: string;
}[] = [
  {
    id: 'vid-1',
    title: 'Morning stretch routine',
    duration: '02:18',
    thumbSrc: '/sample-media/id-card-1.png',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'vid-2',
    title: 'Quick HIIT finisher',
    duration: '04:05',
    thumbSrc: '/sample-media/id-card-2.png',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'vid-3',
    title: 'Core workout (no equipment)',
    duration: '03:12',
    thumbSrc: '/sample-media/id-card-3.png',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 'vid-4',
    title: 'Cool-down + mobility',
    duration: '01:47',
    thumbSrc: '/sample-media/tom.png',
    videoSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
] as const;

const DEMO_AUDIOS: readonly {
  id: string;
  title: string;
  duration: string;
  thumbSrc: string;
  audioSrc: string;
}[] = [
  {
    id: 'aud-1',
    title: 'Breathing reset (guided)',
    duration: '05:30',
    thumbSrc: '/sample-media/id-card-1.png',
    audioSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
  {
    id: 'aud-2',
    title: 'Focus track — deep work',
    duration: '12:10',
    thumbSrc: '/sample-media/id-card-2.png',
    audioSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
  {
    id: 'aud-3',
    title: 'Sleep wind-down (calm)',
    duration: '09:45',
    thumbSrc: '/sample-media/id-card-3.png',
    audioSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
  {
    id: 'aud-4',
    title: 'Motivation talk (short)',
    duration: '03:20',
    thumbSrc: '/sample-media/tom.png',
    audioSrc: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
  },
] as const;

/** Local demo catalog (Products tab). Paths are served from `public/sample-products/`. */
const DEMO_PRODUCTS: readonly {
  id: string;
  title: string;
  price: number;
  imageSrc: string;
  description: string;
}[] = [
  {
    id: 's-391801261',
    title: "Men's Grey Checkered Slim Fit Shirt",
    price: 1899,
    imageSrc: '/sample-products/check-grey-shirt.png',
    description:
      'Long-sleeve button-down with a black grid on dark grey fabric. Chest pocket and a slim, tailored fit—easy to dress up or down.',
  },
  {
    id: 'prod-ae-gradient-plaid',
    title: 'American Eagle Gradient Plaid Flannel Shirt',
    price: 2199,
    imageSrc: '/sample-products/gradient-plaid-flannel.png',
    description:
      'Soft brushed flannel with plaid up top that fades through purple into deep navy at the hem. Twin chest pockets and classic collar.',
  },
  {
    id: 'prod-navy-zip',
    title: "Men's Navy Zip-Up Utility Shirt",
    price: 1999,
    imageSrc: '/sample-products/navy-zip-shirt.png',
    description:
      'Navy short-sleeve utility shirt with full front zip, spread collar, and two chest patch pockets. Layer over a tee for a clean casual look.',
  },
  {
    id: 'prod-mandarin-green',
    title: "Men's Dark Green Mandarin Collar Shirt",
    price: 1799,
    imageSrc: '/sample-products/mandarin-green-shirt.png',
    description:
      'Forest-green shirt with a mandarin collar, button front, and a single chest pocket. Rolled sleeves pair easily with denim.',
  },
  {
    id: 'prod-beyours-dusk-blue',
    title: 'Beyours Dusk Blue Shirt',
    price: 1699,
    imageSrc: '/sample-products/dusk-blue-shirt.png',
    description:
      'Long-sleeve dress shirt in Dusk Blue from Beyours: pointed collar, tonal buttons, and a curved hem—ideal for office or evenings out.',
  },
  {
    id: 'prod-brown-plaid',
    title: "Men's Brown Plaid Button-Down Shirt",
    price: 1999,
    imageSrc: '/sample-products/brown-plaid-shirt.png',
    description:
      'Brown and black plaid on breathable cotton feel. Single chest pocket, versatile regular fit—great for layering or wearing solo.',
  },
];

const drawerNavItems = [
  { href: '/creators', label: 'Creators', icon: Users },
  { href: '/subscriptions', label: 'My Creators', icon: CreditCard },
  { href: '/chats', label: 'Chats', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export function LinkMeCreatorProfile({ username }: LinkMeCreatorProfileProps) {
  const { data: creator, isLoading: creatorLoading, error: creatorError } = useCreatorByUsername(username);
  const { data: config, isLoading: configLoading } = useCreatorProfileConfig(username);
  const { handleButtonClick } = useActionButton();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const { data: plans } = useCreatorPlans(creator?.id || 0);
  const { data: mySubscriptions } = useMySubscriptions();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [scrollY, setScrollY] = useState(0);

  const isMember = useMemo(
    () =>
      creator
        ? isCreatorMemberForFan({
            isAuthenticated,
            creator,
            mySubscriptions,
          })
        : false,
    [isAuthenticated, creator, mySubscriptions]
  );

  const plansForMembership = useMemo(() => {
    if (!creator) return [];
    if (plans?.length) return plans;
    return getDemoCreatorMembershipPlans(creator.id);
  }, [creator, plans]);

  const openMembership = () => {
    setIsMembershipOpen(true);
  };

  const handleCoverClick = () => {
    if (!isAuthenticated) {
      setIsLoginOpen(true);
      return;
    }
    if (!isMember) {
      openMembership();
      return;
    }
  };

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setScrollY(window.scrollY || 0));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const displayName = creator?.name || creator?.username || username;
  const handle = creator?.username || username;
  const bio = config?.intro?.bio?.trim() || '';

  const coverUrl = useMemo(() => {
    // No dedicated "cover photo" in current backend contract; use avatar as best available.
    return getMediaUrl(creator?.avatar) || null;
  }, [creator?.avatar]);

  const social = useMemo(() => buildFixedSocialRow(config?.actionButtons), [config?.actionButtons]);

  if (creatorLoading || configLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-black text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (creatorError || !creator) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-black text-white">
        <Card className="max-w-md w-full bg-zinc-950 text-white border-white/10">
          <CardContent className="pt-6 text-center">
            <p className="text-zinc-400">Creator not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Cover animation
  const fadeDistance = 220;
  const fade = 1 - clamp01(scrollY / fadeDistance);
  const coverTranslate = Math.min(scrollY * 0.2, 60);
  // Show the sticky profile bar only after the hero is fully gone.
  const showStickyProfileBar = scrollY >= fadeDistance;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Always-visible sidebar/menu button */}
      <button
        type="button"
        aria-label="Open menu"
        className="fixed right-4 top-4 z-[60] grid h-10 w-10 place-items-center rounded-md bg-black/30 text-white backdrop-blur hover:bg-black/45"
        onClick={() => setIsDrawerOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        className={[
          'fixed inset-0 z-[70] bg-black/50 transition-opacity',
          isDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside
        className={[
          'fixed right-0 top-0 z-[80] h-full w-72 max-w-[85vw] border-l border-white/10 bg-black shadow-xl transition-transform duration-300',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        aria-hidden={!isDrawerOpen}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/zexy_z_letter_logo_nobg.png"
              alt="Zexy logo"
              width={22}
              height={22}
              className="h-6 w-6 object-contain"
            />
            <span className="text-sm font-semibold tracking-[0.15em]">ZEXY</span>
          </div>
          <button
            type="button"
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white"
            onClick={() => setIsDrawerOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-2 py-3">
          {drawerNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsDrawerOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Profile bar overlay (hidden until hero fully disappears) */}
      <div
        className={[
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          showStickyProfileBar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
        ].join(' ')}
      >
        <div className="bg-black/85 backdrop-blur border-b border-white/10">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="h-8 w-8 overflow-hidden rounded-full bg-white/10">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt={displayName} className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{displayName}</div>
                <div className="truncate text-xs text-zinc-400">@{handle}</div>
              </div>
            </div>
            <div className="h-9 w-9" />
          </div>
        </div>
      </div>

      {/* Cover hero */}
      <section
        className="relative w-full overflow-hidden"
        style={{
          height: 'min(64vh, 520px)',
        }}
        onClick={handleCoverClick}
      >
        {/* Only the IMAGE layer fades/collapses on scroll */}
        <div
          className="absolute inset-0"
          style={{
            opacity: fade,
            transform: `translateY(-${coverTranslate}px)`,
            willChange: 'opacity, transform',
          }}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={displayName}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-black" />
          )}

          {/* Dark gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/10" />
        </div>

        {/* Center content */}
        <div className="absolute inset-x-0 bottom-10 px-4">
          <div className="mx-auto max-w-md text-center">
            <h1 className="text-4xl font-semibold tracking-tight drop-shadow-sm">{displayName}</h1>
            <p className="mt-1 text-sm text-zinc-300">@{handle}</p>

            {/* Social icons row */}
            <div className="mt-4 flex items-center justify-center gap-3">
              {social.map(({ button, kind }, idx) => {
                const isZexy = kind === 'zexy';
                const isEnabled = isZexy || Boolean(button);
                return (
                  <button
                    key={(button?.id || kind) + idx}
                    type="button"
                    aria-label={isZexy ? 'Zexy' : button?.label || kind}
                    className={[
                      'h-11 w-11 rounded-full bg-white grid place-items-center shadow-md shadow-black/40',
                      'hover:bg-zinc-100',
                      !isEnabled ? 'opacity-50 pointer-events-none' : '',
                    ].join(' ')}
                    onClick={
                      isZexy
                        ? (e) => {
                            e.stopPropagation();
                            router.push('/creators');
                          }
                        : button
                          ? (e) => {
                              e.stopPropagation();
                              handleButtonClick(button);
                            }
                          : undefined
                    }
                  >
                    <SocialIcon kind={kind} />
                  </button>
                );
              })}
            </div>

            {bio ? <p className="mt-5 text-base text-zinc-100">{bio}</p> : null}
          </div>
        </div>
      </section>

      {/* Below-the-fold content */}
      <div className="mx-auto max-w-md px-4 pb-10">
        {/* Spacer so content doesn't get covered when bar appears */}
        <div className={showStickyProfileBar ? 'pt-14' : 'pt-0'} />
        {/* Exclusive (big) + Public grid */}
        <div className="pt-6 space-y-4">
          <CreatorMediaBlocks
            creatorAvatarSrc={coverUrl || '/sample-media/tom.png'}
            isAuthenticated={isAuthenticated}
            isMember={isMember}
            onRequireLogin={() => setIsLoginOpen(true)}
            onRequireMembership={openMembership}
          />
        </div>
      </div>

      <SignupModal open={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {isMembershipOpen && (
        <MembershipPopup
          open={isMembershipOpen}
          creatorName={displayName}
          creatorUsername={handle}
          creatorAvatarUrl={coverUrl}
          plans={plansForMembership}
          onClose={() => setIsMembershipOpen(false)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ['creator', 'username', username] });
            void queryClient.invalidateQueries({ queryKey: ['subscriptions', 'my'] });
          }}
        />
      )}
    </div>
  );
}

type MediaGridKind = 'image' | 'video' | 'audio';

type MediaGridItem = {
  id: string;
  thumbSrc: string;
  title: string;
  duration?: string;
  videoSrc?: string;
  audioSrc?: string;
};

function ExclusiveMediaGrid({
  kind,
  items,
  onTileClick,
}: {
  kind?: MediaGridKind;
  items: MediaGridItem[];
  onTileClick: (item: MediaGridItem) => void;
}) {
  if (items.length === 0) return null;

  const [exclusive, ...rest] = items;

  const renderTile = (item: MediaGridItem, isExclusive: boolean) => {
    const tileClass = cn(
      'relative w-full overflow-hidden bg-zinc-900',
      isExclusive ? 'col-span-2 row-span-2 aspect-square' : 'aspect-square'
    );

    const overlays = (
      <>
      {isExclusive ? (
        <span className="pointer-events-none absolute left-2 top-2 z-10 rounded-full bg-pink-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          Exclusive
        </span>
      ) : null}
      {!isExclusive && item.duration ? (
        <div className="pointer-events-none absolute right-1 top-1 z-10 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white">
          {item.duration}
        </div>
      ) : isExclusive && item.duration ? (
        <div className="pointer-events-none absolute right-2 top-2 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-semibold text-white">
          {item.duration}
        </div>
      ) : null}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 to-transparent px-1 pb-1.5 pt-6',
            isExclusive && 'px-2 pb-2 pt-10'
          )}
        >
          <p
            className={cn(
              'line-clamp-2 text-center font-medium text-white',
              isExclusive ? 'text-xs sm:text-sm' : 'text-[9px] sm:text-[10px]'
            )}
          >
            {item.title}
          </p>
        </div>
      </>
    );

    if (kind === 'video' && isExclusive && item.videoSrc) {
      return (
        <div key={item.id} className={tileClass}>
          {overlays}
          <video
            src={item.videoSrc}
            poster={item.thumbSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
            aria-label={item.title}
          />
        </div>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onTileClick(item)}
        className={cn(tileClass, 'p-0')}
      >
        {overlays}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.thumbSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
      </button>
    );
  };

  return (
    <div className="grid w-full grid-cols-3 gap-0">
      {renderTile(exclusive, true)}
      {rest.map((item) => renderTile(item, false))}
    </div>
  );
}

function CreatorMediaBlocks({
  creatorAvatarSrc,
  isAuthenticated,
  isMember,
  onRequireLogin,
  onRequireMembership,
}: {
  creatorAvatarSrc: string;
  isAuthenticated: boolean;
  isMember: boolean;
  onRequireLogin: () => void;
  onRequireMembership: () => void;
}) {
  const [activeTab, setActiveTab] = useState<ContentTabId>('images');
  const [popup, setPopup] = useState<{
    src: string;
    title: string;
    description?: string;
    videoSrc?: string;
    audioSrc?: string;
  } | null>(null);

  const demoImageItems = useMemo<MediaGridItem[]>(
    () =>
      Array.from({ length: DEMO_IMAGES_GRID_COUNT }, (_, i) => ({
        id: `demo-img-${i}`,
        thumbSrc: DEMO_PROFILE_IMAGE_SRCS[i % DEMO_PROFILE_IMAGE_SRCS.length],
        title: i === 0 ? 'Exclusive highlight' : `Demo ${i + 1}`,
      })),
    []
  );

  const demoVideoItems = useMemo<MediaGridItem[]>(
    () =>
      DEMO_VIDEOS.map((v, i) => ({
        id: v.id,
        thumbSrc: v.thumbSrc,
        title: i === 0 ? 'Exclusive highlight' : v.title,
        duration: v.duration,
        videoSrc: v.videoSrc,
      })),
    []
  );

  const demoAudioItems = useMemo<MediaGridItem[]>(
    () =>
      DEMO_AUDIOS.map((a, i) => ({
        id: a.id,
        thumbSrc: a.thumbSrc,
        title: i === 0 ? 'Exclusive highlight' : a.title,
        duration: a.duration,
        audioSrc: a.audioSrc,
      })),
    []
  );

  const requestAccessThen = (openContent: () => void) => {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    if (!isMember) {
      onRequireMembership();
      return;
    }
    openContent();
  };

  const openGridItem = (item: MediaGridItem, kind: MediaGridKind) => {
    requestAccessThen(() => {
      if (kind === 'audio') {
        setPopup({ src: creatorAvatarSrc, title: item.title, audioSrc: item.audioSrc });
      } else if (kind === 'video') {
        setPopup({ src: item.thumbSrc, title: item.title, videoSrc: item.videoSrc });
      } else {
        setPopup({ src: item.thumbSrc, title: item.title });
      }
    });
  };

  return (
    <Card className="-mx-4 w-[calc(100%+2rem)] overflow-hidden rounded-2xl border-white/10 bg-white/[0.03] p-0 shadow-none sm:mx-0 sm:w-full">
      <div className="grid w-full grid-cols-4 border-b border-white/15">
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
                  ? 'border-b-2 border-pink-500 text-white'
                  : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
              )}
            >
              <TabIcon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'images' ? (
        <ExclusiveMediaGrid
          items={demoImageItems}
          onTileClick={(item) => openGridItem(item, 'image')}
        />
      ) : activeTab === 'videos' ? (
        <ExclusiveMediaGrid
          kind="video"
          items={demoVideoItems}
          onTileClick={(item) => openGridItem(item, 'video')}
        />
      ) : activeTab === 'audios' ? (
        <ExclusiveMediaGrid
          items={demoAudioItems}
          onTileClick={(item) => openGridItem(item, 'audio')}
        />
      ) : activeTab === 'products' ? (
        <div className="grid w-full grid-cols-3 gap-0">
          {DEMO_PRODUCTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                requestAccessThen(() =>
                  setPopup({ src: p.imageSrc, title: p.title, description: p.description })
                )
              }
              className="relative aspect-square w-full overflow-hidden bg-zinc-900 p-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageSrc} alt="" className="h-full w-full object-cover" loading="lazy" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pb-1.5 pt-6">
                <p className="line-clamp-2 text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">{p.title}</p>
                <p className="mt-0.5 text-center text-[8px] font-semibold text-zinc-200 sm:text-[9px]">
                  {formatCurrency(p.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-500">Nothing here yet.</p>
        </div>
      )}

      <ContentPopup
        open={popup !== null}
        onClose={() => setPopup(null)}
        title={popup?.title ?? ''}
        imageSrc={popup?.src ?? ''}
        imageAlt={popup?.title ?? ''}
        videoSrc={popup?.videoSrc}
        audioSrc={popup?.audioSrc}
        description={popup?.description}
        onBuyNow={
          popup?.description
            ? () => toast.message('Checkout coming soon.')
            : undefined
        }
      />
    </Card>
  );
}
