'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useResolvedSubscriptionRows } from '@/hooks/useResolvedSubscriptionRows';
import { Input } from '@/components/ui/input';
import { Loader2, MessageCircle, Image as ImageIcon, Video, Music, Package, Search } from 'lucide-react';
import { subscriptionAvatarSrc } from '@/lib/subscriptionUi';
import type { ActiveSubscription } from '@/services/subscriptions';

function HollowBadge({
  icon: Icon,
  count,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-border bg-transparent px-2 py-0.5 text-[11px] text-muted-foreground"
      title={label}
    >
      <Icon className="size-3 shrink-0" aria-hidden />
      <span className="tabular-nums font-medium">{count}</span>
    </span>
  );
}

function SubscribedCreatorRow({ sub }: { sub: ActiveSubscription }) {
  const avatarUrl = subscriptionAvatarSrc(sub.creator_avatar);

  return (
    <div className="-mx-4 border-b border-border px-4 py-4 last:border-b-0 sm:-mx-0 sm:px-0">
      <div className="flex gap-3">
        <Link href={`/creator/${sub.creator_username}`} className="flex min-w-0 flex-1 gap-3">
          <div className="flex size-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-semibold text-white">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center">{sub.creator_name?.[0] || 'C'}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight">{sub.creator_name}</p>
            <p className="truncate text-sm text-muted-foreground">@{sub.creator_username}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <HollowBadge icon={ImageIcon} count={sub.image_count ?? 0} label="Images" />
              <HollowBadge icon={Video} count={sub.video_count ?? 0} label="Videos" />
              <HollowBadge icon={Music} count={sub.audio_count ?? 0} label="Audios" />
              <HollowBadge icon={Package} count={sub.product_count ?? 0} label="Products" />
            </div>
          </div>
        </Link>

        <Link
          href="/chats"
          className="flex size-10 shrink-0 items-center justify-center self-start rounded-full border border-border bg-transparent text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={`Chat with ${sub.creator_name}`}
        >
          <MessageCircle className="size-5" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}

export default function MyCreatorsPage() {
  const { rows, isLoading, error } = useResolvedSubscriptionRows();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (sub) =>
        sub.creator_name.toLowerCase().includes(q) || sub.creator_username.toLowerCase().includes(q)
    );
  }, [rows, query]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">Failed to load your creators</p>
      </div>
    );
  }

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
          placeholder="Search creators…"
          className="pl-9"
          aria-label="Search subscribed creators"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {query.trim() ? 'No creators match your search.' : 'You are not subscribed to any creators yet.'}
        </p>
      ) : (
        <div>
          {filtered.map((sub) => (
            <SubscribedCreatorRow key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
