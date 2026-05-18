'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useResolvedSubscriptionRows } from '@/hooks/useResolvedSubscriptionRows';
import { Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  daysLeftLabel,
  formatSubscriptionDetailDate,
  membershipDaysLeftPercent,
  subscriptionAvatarSrc,
} from '@/lib/subscriptionUi';

export default function SubscriptionDetailPage() {
  const params = useParams();
  const subscriptionId = Number(params.subscriptionId);
  const { rows, isLoading, error } = useResolvedSubscriptionRows();

  const sub = useMemo(
    () => (Number.isFinite(subscriptionId) ? rows.find((r) => r.id === subscriptionId) : undefined),
    [rows, subscriptionId]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-destructive">Failed to load subscription</p>
        <Link href="/membership" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to My subscription
        </Link>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Subscription not found.</p>
        <Link href="/membership" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Back to My subscription
        </Link>
      </div>
    );
  }

  const pct = membershipDaysLeftPercent(sub.started_at, sub.expires_at);
  const daysLabel = daysLeftLabel(sub.expires_at);
  const avatarUrl = subscriptionAvatarSrc(sub.creator_avatar);
  const monthly = sub.monthly_amount != null && sub.monthly_amount > 0 ? sub.monthly_amount : null;
  const txn = sub.transaction_code?.trim() || '—';

  return (
    <div className="-mt-2 space-y-0">
      <div className="flex flex-col gap-2">
        <div className="flex gap-3">
          <div className="flex h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-semibold text-white">
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
              </div>
              <div className="shrink-0 text-right">
                {monthly != null ? (
                  <>
                    <p className="text-sm font-semibold tabular-nums text-foreground">{formatCurrency(monthly)}</p>
                    <p className="text-xs text-muted-foreground">/ month</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
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
                  className="h-full rounded-full bg-zinc-300 transition-[width] dark:bg-zinc-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="h-px w-full bg-zinc-200/95 dark:bg-zinc-700/90" aria-hidden />

        <dl className="space-y-4 pt-1 text-sm">
          <div>
            <dt className="text-muted-foreground">Start date of subscription</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{formatSubscriptionDetailDate(sub.started_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">End date</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{formatSubscriptionDetailDate(sub.expires_at)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Transaction code</dt>
            <dd className="mt-0.5 font-mono text-xs font-medium tracking-wide break-all">{txn}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
