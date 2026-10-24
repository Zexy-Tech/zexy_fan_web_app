'use client';

import Link from 'next/link';
import { useResolvedSubscriptionRows } from '@/hooks/useResolvedSubscriptionRows';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  daysLeftLabel,
  membershipDaysLeftPercent,
  subscriptionAvatarSrc,
} from '@/lib/subscriptionUi';

function MembershipRow({
  sub,
}: {
  sub: {
    id: number;
    creator_name: string;
    creator_username: string;
    creator_avatar?: string | null;
    started_at: string;
    expires_at: string;
    monthly_amount?: number | null;
    plan_name?: string | null;
  };
}) {
  const pct = membershipDaysLeftPercent(sub.started_at, sub.expires_at);
  const daysLabel = daysLeftLabel(sub.expires_at);
  const avatarUrl = subscriptionAvatarSrc(sub.creator_avatar);
  const monthly = sub.monthly_amount != null && sub.monthly_amount > 0 ? sub.monthly_amount : null;

  return (
    <Link
      href={`/subscriptions/${sub.id}`}
      className="-mx-4 block border-b border-border px-4 py-4 last:border-b-0 hover:bg-accent/40 sm:-mx-0 sm:px-0"
    >
      <div className="flex gap-3">
        <div className="flex size-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-semibold text-white">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center">{sub.creator_name?.[0] || 'C'}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold leading-tight">{sub.creator_name}</p>
              <p className="truncate text-sm text-muted-foreground">@{sub.creator_username}</p>
              {sub.plan_name ? (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub.plan_name}</p>
              ) : null}
            </div>
            {monthly != null ? (
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(monthly)}</p>
                <p className="text-xs text-muted-foreground">/ month</p>
              </div>
            ) : null}
          </div>

          <div className="mt-2 flex min-w-0 flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <span>Subscription time left</span>
              <span className="shrink-0 tabular-nums">{daysLabel}</span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label={`Subscription: ${daysLabel}, ${pct}% of period remaining`}
              className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800/90"
            >
              <div
                className="h-full rounded-full bg-zinc-300 dark:bg-zinc-400"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function MembershipPage() {
  const { rows, isLoading, error } = useResolvedSubscriptionRows();

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
        <p className="text-sm text-destructive">Failed to load subscriptions</p>
      </div>
    );
  }

  return (
    <div className="-mt-2 space-y-0">
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          You don&apos;t have any active subscriptions yet.
        </p>
      ) : (
        <div>
          {rows.map((sub) => (
            <MembershipRow key={sub.id} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}
