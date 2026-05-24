'use client';

import type { Message } from '@/services/messages';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { usePayTipDemand } from '@/hooks/useMessages';
import { CheckCircle2, Coins, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface TipDemandMessageProps {
  message: Message;
  creatorId: number;
  creatorDisplayName: string;
  /** True when the current user sent this message (fan app: tip demands are always from the creator). */
  mine: boolean;
}

export function TipDemandMessage({
  message: m,
  creatorId,
  creatorDisplayName,
  mine,
}: TipDemandMessageProps) {
  const payTip = usePayTipDemand(creatorId);
  const amount = m.tip_amount != null ? Number(m.tip_amount) : 0;
  const paid = !!m.tip_paid;
  const note = m.body?.trim();

  const handlePay = async () => {
    try {
      await payTip.mutateAsync(m.id);
      toast.success('Tip sent! Thank you for supporting the creator.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      toast.error(err.response?.data?.error?.message || 'Payment could not be completed. Try again.');
    }
  };

  return (
    <div className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-md border',
          paid
            ? 'bg-muted/80 border-emerald-500/30'
            : 'bg-gradient-to-br from-amber-950/40 via-background to-violet-950/30 border-amber-500/20'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-9 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
              <Coins className="size-4 text-amber-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground leading-tight">
                {paid && !mine
                  ? 'You sent this tip'
                  : paid
                    ? 'Tip recorded'
                    : `${creatorDisplayName} requested a tip`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {paid && !mine
                  ? 'Thanks for supporting your creator.'
                  : paid
                    ? 'Payment is logged on this chat.'
                    : 'Pay securely to fulfill this tip request.'}
              </p>
            </div>
          </div>
          {paid ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 shrink-0">
              <CheckCircle2 className="size-3" />
              Paid
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 shrink-0">
              Pending
            </span>
          )}
        </div>

        <p className="text-lg font-bold tabular-nums mt-3 text-foreground">
          {formatCurrency(amount)}
        </p>

        {note ? (
          <p className="mt-2 text-muted-foreground whitespace-pre-wrap break-words border-t border-border/50 pt-2 text-xs">
            {note}
          </p>
        ) : null}

        {!paid && !mine ? (
          <Button
            type="button"
            className="mt-4 w-full font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            disabled={payTip.isPending || amount <= 0}
            onClick={() => void handlePay()}
          >
            {payTip.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Processing…
              </>
            ) : (
              `Pay ${formatCurrency(amount)}`
            )}
          </Button>
        ) : null}

        <p className="text-[10px] mt-2 opacity-70 text-muted-foreground">
          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
