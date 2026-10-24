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
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCreatorByUsername, useCreatorContentByUsername, useCreatorProductsByUsername } from '@/hooks/useFeed';
import { useCreatorProfileConfig } from '@/hooks/useCreatorProfile';
import { useCreatorPlans, useMySubscriptions } from '@/hooks/useSubscriptions';
import { useAuthContext } from '@/hooks/useAuth';
import { cn, formatCurrency, getMediaUrl } from '@/lib/utils';
import { toUserCode } from '@/lib/userCode';
import { isCreatorMemberForFan } from '@/lib/creatorMembership';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { useActionButton } from '@/hooks/useActionButton';
import dynamic from 'next/dynamic';

const SignupModal = dynamic(
  () => import('@/components/auth/signup-modal').then((mod) => mod.SignupModal),
  { ssr: false }
);
const MembershipPopup = dynamic(
  () => import('@/components/membership-popup').then((mod) => mod.MembershipPopup),
  { ssr: false }
);
const ContentPopup = dynamic(
  () => import('@/components/content-popup').then((mod) => mod.ContentPopup),
  { ssr: false }
);
import type { ActionButton } from '@/types/creator-profile';
import type { Content, Product } from '@/services/feed';
import type { LucideIcon } from 'lucide-react';
import {
  Instagram,
  Facebook,
  Youtube,
  Loader2,
  ExternalLink,
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
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';


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

function SocialIcon({ kind, className }: { kind: SocialKind; className?: string }) {
  const cls = cn('size-4', className);
  switch (kind) {
    case 'instagram': return <Instagram className={cn(cls, "text-[#E1306C]")} />;
    case 'facebook': return <Facebook className={cn(cls, "text-[#1877F2]")} />;
    case 'facebook_page': return <Flag className={cn(cls, "text-[#1877F2]")} />;
    case 'x':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" className={cn(cls, "fill-current")}>
          <path d="M18.901 1.153h3.68l-8.039 9.189L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932Zm-1.29 19.493h2.039L6.486 3.24H4.298L17.611 20.646Z" />
        </svg>
      );
    case 'youtube': return <Youtube className={cn(cls, "text-[#FF0000]")} />;
    case 'snapchat': return <Ghost className={cn(cls, "text-[#FFFC00]")} />;
    case 'telegram': return <Send className={cn(cls, "text-[#0088cc]")} />;
    case 'threads': return <AtSign className={cn(cls, "text-current")} />;
    case 'website': return <Globe className={cn(cls, "text-zinc-400")} />;
    case 'linkedin': return <Linkedin className={cn(cls, "text-[#0a66c2]")} />;
    case 'reddit': return <MessageSquare className={cn(cls, "text-[#ff4500]")} />;
    case 'discord': return <MessageSquare className={cn(cls, "text-[#5865f2]")} />;
    case 'quora': return <HelpCircle className={cn(cls, "text-[#b92b27]")} />;
    case 'takatak': return <Video className={cn(cls, "text-pink-500")} />;
    case 'chingari': return <Flame className={cn(cls, "text-orange-500")} />;
    case 'josh': return <PlayCircle className={cn(cls, "text-red-500")} />;
    case 'link': return <ExternalLink className={cn(cls, "text-zinc-400")} />;
    case 'zexy':
      return (
        <Image
          src="/zexy_z_letter_logo_nobg.png"
          alt="Zexy"
          width={16}
          height={16}
          className={cn(cls, "object-contain")}
        />
      );
  }
}

type SocialEntry = {
  kind: SocialKind;
  label: string;
  button?: ActionButton;
};

function buildFixedSocialRow(actionButtons: ActionButton[] | undefined): SocialEntry[] {
  const links = Array.isArray(actionButtons)
    ? actionButtons.filter((b) => b && b.type === 'custom_link' && typeof b.action === 'string')
    : [];

  const platforms: { kind: SocialKind; label: string }[] = [
    { kind: 'instagram', label: 'Instagram' },
    { kind: 'youtube', label: 'YouTube' },
    { kind: 'x', label: 'X' },
    { kind: 'facebook', label: 'Facebook' },
    { kind: 'facebook_page', label: 'FB Page' },
    { kind: 'snapchat', label: 'Snapchat' },
    { kind: 'telegram', label: 'Telegram' },
    { kind: 'threads', label: 'Threads' },
    { kind: 'website', label: 'Website' },
    { kind: 'linkedin', label: 'LinkedIn' },
    { kind: 'reddit', label: 'Reddit' },
    { kind: 'discord', label: 'Discord' },
    { kind: 'quora', label: 'Quora' },
    { kind: 'takatak', label: 'TakaTak' },
    { kind: 'chingari', label: 'Chingari' },
    { kind: 'josh', label: 'Josh' }
  ];

  const result: SocialEntry[] = platforms
    .map(({ kind, label }) => {
       const button = links.find((b) => b?.action && inferSocialKind(b.action) === kind);
       return { kind, label: button?.label || label, button };
    })
    .filter(entry => !!entry.button);
  
  // Zexy icon always present at the end
  result.push({ kind: 'zexy', label: 'Zexy' });

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

export function LinkMeCreatorProfile({ username }: LinkMeCreatorProfileProps) {
  const { data: creator, isLoading: creatorLoading, error: creatorError } = useCreatorByUsername(username);
  const { data: config, isLoading: configLoading } = useCreatorProfileConfig(username);
  const { data: content, isLoading: contentLoading } = useCreatorContentByUsername(username);
  const { data: products, isLoading: productsLoading } = useCreatorProductsByUsername(username);
  const { handleButtonClick } = useActionButton();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  const { data: plans } = useCreatorPlans(creator?.id || 0);
  const { data: mySubscriptions } = useMySubscriptions();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);

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
    return plans || [];
  }, [plans]);

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

  const creatorCode = creator?.user_code || toUserCode(creator?.id || username, 'creator');
  const displayName = creator?.name || creator?.username || creatorCode || 'Creator';
  const handle = creator?.username || (username && !/^\d+$/.test(username) ? username : creatorCode);
  const bio = config?.intro?.bio?.trim() || '';

  const coverUrl = useMemo(() => {
    // No dedicated "cover photo" in current backend contract; use avatar as best available.
    return getMediaUrl(creator?.avatar) || null;
  }, [creator?.avatar]);

  const social = useMemo(() => {
    const fromConfig = buildFixedSocialRow(config?.actionButtons);
    
    // If we want to be extra sure or handle legacy, we can also build from creator.social_links
    // but the backend merge is preferred.
    return fromConfig;
  }, [config?.actionButtons]);

  if (creatorLoading || configLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-background text-foreground">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (creatorError || !creator) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 bg-background text-foreground">
        <Card className="max-w-md w-full border-border bg-card shadow-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Creator not found</p>
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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Profile bar overlay (hidden until hero fully disappears) */}
      <div
        className={[
          'fixed inset-x-0 top-0 z-50',
          showStickyProfileBar ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none',
        ].join(' ')}
      >
        <div className="bg-zinc-950/85 backdrop-blur border-b border-white/10">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="size-8 overflow-hidden rounded-full bg-white/10 relative">
                {coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={displayName}
                    fill
                    sizes="32px"
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </div>

              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{displayName}</div>
                <div className="truncate text-xs text-zinc-400">@{handle}</div>
              </div>
            </div>
            <div className="size-9" />
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCoverClick();
          }
        }}
        role="button"
        tabIndex={0}
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
            <Image
              src={coverUrl}
              alt={displayName}
              fill
              sizes="100vw"
              className="absolute inset-0 h-full w-full object-cover"
              priority
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 to-zinc-950" />
          )}

          {/* Dark gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-black/10 to-black/10" />
        </div>

        {/* Center content */}
        <div className="absolute inset-x-0 bottom-10 px-4">
          <div className="mx-auto max-w-md text-center flex flex-col items-center">
            <h1 className="text-lg font-semibold tracking-tight drop-shadow-sm">{displayName}</h1>
            <p className="mt-1 text-sm text-zinc-300">@{handle}</p>
            {creatorCode && (
              <span className="mt-1.5 inline-block rounded-full bg-black/40 backdrop-blur-sm border border-white/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-purple-200">
                {creatorCode}
              </span>
            )}

            {config?.is_live && (
              <Badge 
                className="mt-4 bg-red-500 hover:bg-red-600 text-white cursor-pointer px-3 py-1.5 flex items-center gap-2 rounded-full border-none"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/live/${config.active_room_id}`);
                }}
              >
                <Radio className="size-4" />
                <span className="font-bold tracking-wider">LIVE NOW</span>
              </Badge>
            )}

            {/* Subscribe / Message Button */}
            <div className="mt-4 flex justify-center">
              {!isMember ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      setIsLoginOpen(true);
                    } else {
                      setIsMembershipOpen(true);
                    }
                  }}
                  className="rounded-full bg-pink-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 hover:bg-pink-600"
                >
                  Subscribe
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (creator?.id) {
                      router.push(`/chats/${creator.id}`);
                    }
                  }}                  className="rounded-full bg-white/10 border border-white/10 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/20"
                >
                  Message
                </button>
              )}
            </div>

            {/* Social icons row */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              {social.map(({ button, kind, label }, idx) => {
                const isZexy = kind === 'zexy';
                const isEnabled = isZexy || Boolean(button);
                return (
                  <button
                    key={(button?.id || kind) + idx}
                    type="button"
                    aria-label={label || (isZexy ? 'Zexy' : kind)}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/10 text-white',
                      'hover:bg-white/15',
                      !isEnabled ? 'opacity-50 pointer-events-none' : '',
                    ].join(' ')}
                    onClick={
                      isZexy
                        ? (e) => {
                            e.stopPropagation();
                            router.push('/creators');
                          }                        : button
                          ? (e) => {
                              e.stopPropagation();
                              handleButtonClick(button);
                            }
                          : undefined
                    }
                  >
                    <SocialIcon kind={kind} />
                    <span className="text-[11px] font-medium tracking-wide uppercase opacity-90">{label}</span>
                  </button>
                );
              })}
            </div>

            {bio ? <p className="mt-5 text-sm text-zinc-100">{bio}</p> : null}
          </div>
        </div>
      </section>

      {/* Below-the-fold content */}
      <div className="mx-auto max-w-md px-4">
        {/* Spacer so content doesn't get covered when bar appears */}
        {/* <div className={showStickyProfileBar ? 'pt-14' : 'pt-0'} /> */}
        {/* Exclusive (big) + Public grid */}
        <div className="space-y-4">
          <CreatorMediaBlocks
            isAuthenticated={isAuthenticated}
            isMember={isMember}
            onRequireLogin={() => setIsLoginOpen(true)}
            onRequireMembership={openMembership}
            content={content || []}
            products={products || []}
            isLoading={contentLoading || productsLoading}
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
  contentId?: number;
  thumbSrc: string;
  title: string;
  description?: string | null;
  tags: string[];
  isLiked: boolean;
  isSaved: boolean;
  isLocked: boolean;
  duration?: string;
  videoSrc?: string;
  audioSrc?: string;
};

function MediaImageTile({
  src,
  alt,
  sizes,
  isLocked,
  fallbackIcon: FallbackIcon,
  isExclusive,
}: {
  src: string;
  alt: string;
  sizes: string;
  isLocked?: boolean;
  fallbackIcon: LucideIcon;
  isExclusive?: boolean;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex size-full items-center justify-center bg-zinc-900/50">
        <FallbackIcon className={cn("text-zinc-700", isExclusive ? "size-16" : "size-10")} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <Image 
      src={src} 
      alt={alt} 
      fill
      sizes={sizes}
      className={cn("h-full w-full object-cover", isLocked && "blur-sm opacity-60")} 
      loading="lazy" 
      unoptimized
      onError={() => setHasError(true)}
    />
  );
}

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
        <button
          key={item.id}
          type="button"
          onClick={() => onTileClick(item)}
          className={cn(tileClass, 'p-0 text-left')}
        >
          {overlays}
          <video
            src={item.videoSrc}
            poster={item.thumbSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className={cn("h-full w-full object-cover", item.isLocked && "blur-sm opacity-60")}
            aria-label={item.title}
          />
        </button>
      );
    }

    if (kind === 'video' && !item.thumbSrc) {
       return (
        <button
          key={item.id}
          type="button"
          onClick={() => onTileClick(item)}
          className={cn(tileClass, 'p-0')}
        >
          {overlays}
          <div className="flex h-full w-full items-center justify-center bg-zinc-900/50">
            <Video className={cn("text-zinc-700", isExclusive ? "size-16" : "size-10")} strokeWidth={1.5} />
          </div>
        </button>
      );
    }

    if (kind === 'audio') {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => onTileClick(item)}
          className={cn(tileClass, 'p-0')}
        >
          {overlays}
          <div className="flex size-full items-center justify-center bg-zinc-900/50">
            <MediaImageTile
              src={item.thumbSrc}
              alt={item.title}
              sizes="320px"
              isLocked={item.isLocked}
              fallbackIcon={Music}
              isExclusive={isExclusive}
            />
          </div>
        </button>
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
        <MediaImageTile
          src={item.thumbSrc}
          alt={item.title}
          sizes={isExclusive ? "640px" : "320px"}
          isLocked={item.isLocked}
          fallbackIcon={LucideImage}
          isExclusive={isExclusive}
        />
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

function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 rounded-full bg-white/[0.02] p-5 border border-white/5 shadow-inner">
        <Icon className="size-8 text-zinc-700" strokeWidth={1} />
      </div>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-[0.2em] opacity-80">{message}</p>
    </div>
  );
}

function CreatorMediaBlocks({
  isAuthenticated,
  isMember,
  onRequireLogin,
  onRequireMembership,
  content,
  products,
  isLoading,
}: {
  isAuthenticated: boolean;
  isMember: boolean;
  onRequireLogin: () => void;
  onRequireMembership: () => void;
  content: Content[];
  products: Product[];
  isLoading: boolean;
}) {
  const [activeTab, setActiveTab] = useState<ContentTabId>('images');
  const [popup, setPopup] = useState<{
    contentId?: number;
    src: string;
    title: string;
    description?: string;
    price?: number;
    isProduct?: boolean;
    tags?: string[];
    isLiked?: boolean;
    isSaved?: boolean;
    videoSrc?: string;
    audioSrc?: string;
  } | null>(null);

  const safeContent = useMemo(() => (Array.isArray(content) ? content : []), [content]);
  const safeProducts = useMemo(() => (Array.isArray(products) ? products : []), [products]);

  const imageItems = useMemo<MediaGridItem[]>(() => {
    return safeContent.reduce((acc, c) => {
      if (!c) return acc;
      const media = Array.isArray(c.media) ? c.media : [];
      const hasImageMedia = media.some((m) => m?.media_type === 'image');
      if (c.type === 'image' || (!c.type && hasImageMedia)) {
        const imageMediaUrl = media.find((m) => m?.media_type === 'image')?.url;
        acc.push({
          id: String(c.id),
          contentId: c.id,
          thumbSrc: getMediaUrl(c.thumbnail_url || imageMediaUrl || c.url) || '',
          title: c.title || 'Untitled',
          description: c.description,
          tags: Array.isArray(c.tags) ? c.tags : [],
          isLiked: Boolean(c.is_liked),
          isSaved: Boolean(c.is_saved),
          isLocked: Boolean(c.is_locked),
        });
      }
      return acc;
    }, [] as MediaGridItem[]);
  }, [safeContent]);

  const videoItems = useMemo<MediaGridItem[]>(() => {
    return safeContent.reduce((acc, c) => {
      if (!c) return acc;
      const media = Array.isArray(c.media) ? c.media : [];
      const hasVideoMedia = media.some((m) => m?.media_type === 'video');
      if (c.type === 'video' || (!c.type && hasVideoMedia)) {
        const imageMediaUrl = media.find((m) => m?.media_type === 'image')?.url;
        const videoMediaUrl = media.find((m) => m?.media_type === 'video')?.url;
        acc.push({
          id: String(c.id),
          contentId: c.id,
          thumbSrc: getMediaUrl(c.thumbnail_url || imageMediaUrl) || '',
          title: c.title || 'Untitled',
          description: c.description,
          tags: Array.isArray(c.tags) ? c.tags : [],
          isLiked: Boolean(c.is_liked),
          isSaved: Boolean(c.is_saved),
          isLocked: Boolean(c.is_locked),
          videoSrc: getMediaUrl(c.url || videoMediaUrl) || '',
        });
      }
      return acc;
    }, [] as MediaGridItem[]);
  }, [safeContent]);

  const audioItems = useMemo<MediaGridItem[]>(() => {
    return safeContent.reduce((acc, c) => {
      if (!c) return acc;
      const media = Array.isArray(c.media) ? c.media : [];
      const hasAudioMedia = media.some((m) => m?.media_type === 'audio');
      if (c.type === 'audio' || hasAudioMedia) {
        const audioMediaUrl = media.find((m) => m?.media_type === 'audio')?.url;
        acc.push({
          id: String(c.id),
          contentId: c.id,
          thumbSrc: getMediaUrl(c.thumbnail_url) || '',
          title: c.title || 'Untitled',
          description: c.description,
          tags: Array.isArray(c.tags) ? c.tags : [],
          isLiked: Boolean(c.is_liked),
          isSaved: Boolean(c.is_saved),
          isLocked: Boolean(c.is_locked),
          audioSrc: getMediaUrl(audioMediaUrl) || '',
        });
      }
      return acc;
    }, [] as MediaGridItem[]);
  }, [safeContent]);

  const requestAccessThen = (needsAccess: boolean, openContent: () => void) => {
    if (needsAccess && !isAuthenticated) {
      onRequireLogin();
      return;
    }
    if (needsAccess && !isMember) {
      onRequireMembership();
      return;
    }
    openContent();
  };

  const openGridItem = (item: MediaGridItem, kind: MediaGridKind) => {
    requestAccessThen(item.isLocked, () => {
      if (kind === 'audio') {
        setPopup({ src: item.thumbSrc, title: item.title, audioSrc: item.audioSrc, contentId: item.contentId, description: item.description || undefined, tags: item.tags, isLiked: item.isLiked, isSaved: item.isSaved });
      } else if (kind === 'video') {
        setPopup({ src: item.thumbSrc, title: item.title, videoSrc: item.videoSrc, contentId: item.contentId, description: item.description || undefined, tags: item.tags, isLiked: item.isLiked, isSaved: item.isSaved });
      } else {
        setPopup({ src: item.thumbSrc, title: item.title, contentId: item.contentId, description: item.description || undefined, tags: item.tags, isLiked: item.isLiked, isSaved: item.isSaved });
      }
    });
  };

  if (isLoading) {
    return (
      <Card className="-mx-4 w-[calc(100%+2rem)] overflow-hidden rounded-2xl border-white/10 bg-white/[0.03] p-12 shadow-none sm:mx-0 sm:w-full flex items-center justify-center">
        <Loader2 className="size-6 animate-spin text-zinc-500" />
      </Card>
    );
  }

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
                'flex w-full flex-col items-center justify-center gap-1 px-1 py-2.5 text-xs font-medium sm:flex-row sm:gap-1.5 sm:px-2 sm:text-sm',
                active
                  ? 'border-b-2 border-pink-500 text-white'
                  : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300'
              )}
            >
              <TabIcon className="size-4 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      <div className="min-h-[200px]">
        {activeTab === 'images' && (
          imageItems.length > 0 ? (
            <ExclusiveMediaGrid
              items={imageItems}
              onTileClick={(item) => openGridItem(item, 'image')}
            />
          ) : (
            <EmptyState icon={LucideImage} message="No images yet" />
          )
        )}

        {activeTab === 'videos' && (
          videoItems.length > 0 ? (
            <ExclusiveMediaGrid
              kind="video"
              items={videoItems}
              onTileClick={(item) => openGridItem(item, 'video')}
            />
          ) : (
            <EmptyState icon={Video} message="No videos yet" />
          )
        )}

        {activeTab === 'audios' && (
          audioItems.length > 0 ? (
            <ExclusiveMediaGrid
              kind="audio"
              items={audioItems}
              onTileClick={(item) => openGridItem(item, 'audio')}
            />
          ) : (
            <EmptyState icon={Music} message="No audio tracks yet" />
          )
        )}

        {activeTab === 'products' && (
          <div className="grid w-full grid-cols-3 gap-0">
            {safeProducts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() =>
                  requestAccessThen(false, () =>
                    setPopup({
                      contentId: p.id,
                      src: getMediaUrl(p.image_urls?.[0]) || '',
                      title: p.name,
                      description: p.description,
                      price: p.price,
                      isProduct: true,
                      isLiked: p.is_liked,
                      isSaved: p.is_saved,
                    })
                  )
                }
                className="relative aspect-square w-full overflow-hidden bg-zinc-900 p-0"
              >
                {p.image_urls?.[0] && (
                  <Image
                    src={getMediaUrl(p.image_urls[0]) || ''}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 200px"
                    unoptimized
                  />
                )}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-1 pb-1.5 pt-6">
                  <p className="line-clamp-2 text-center text-[9px] font-medium leading-tight text-white sm:text-[10px]">
                    {p.name}
                  </p>
                  <p className="mt-0.5 text-center text-[8px] font-semibold text-zinc-200 sm:text-[9px]">
                    {formatCurrency(p.price)}
                  </p>
                </div>
              </button>
            ))}
            {safeProducts.length === 0 && (
              <div className="col-span-3">
                <EmptyState icon={Package} message="No products yet" />
              </div>
            )}
          </div>
        )}
      </div>

      <ContentPopup
        open={popup !== null}
        onClose={() => setPopup(null)}
        contentId={popup?.contentId}
        title={popup?.title ?? ''}
        imageSrc={popup?.src ?? ''}
        imageAlt={popup?.title ?? ''}
        videoSrc={popup?.videoSrc}
        audioSrc={popup?.audioSrc}
        description={popup?.description}
        price={popup?.price}
        isProduct={popup?.isProduct}
        tags={popup?.tags}
        initialLiked={popup?.isLiked}
        initialSaved={popup?.isSaved}
        onBuyNow={
          popup?.isProduct ? () => toast.message('Checkout coming soon.') : undefined
        }
      />
    </Card>
  );
}
