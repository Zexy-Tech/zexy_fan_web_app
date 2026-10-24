/**
 * Subscription Modal
 *
 * Handles the full subscribe → pay → activate flow for a creator's subscription plans.
 */

'use client';

import { useState } from 'react';
import { useCreateSubscriptionIntent } from '@/hooks/useSubscriptions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, CheckCircle2, Crown, Loader2, X, XCircle } from 'lucide-react';
import { cn, formatCurrency, getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import type { SubscriptionPlan } from '@/services/subscriptions';
import type { CreateIntentResponse } from '@/services/payment';
import { DirectUpiCheckoutModal } from '@/components/payments/DirectUpiCheckoutModal';
import { AxiosError } from 'axios';

interface SubscriptionModalProps {
  creatorName: string;
  plans: SubscriptionPlan[];
  onClose: () => void;
  onSuccess?: () => void;
  /** `membership` uses membership-oriented headings (e.g. creator profile paywall). */
  presentation?: 'subscribe' | 'membership';
  /** @username without leading @ — shown top-left in membership layout. */
  creatorUsername?: string | null;
  /** Resolved image URL for creator avatar (top-left membership layout). */
  creatorAvatarUrl?: string | null;
}

type Status = 'select' | 'processing' | 'success' | 'error';

export function SubscriptionModal({
  creatorName,
  plans,
  onClose,
  presentation = 'subscribe',
  creatorUsername,
  creatorAvatarUrl,
  onSuccess,
}: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(plans[0]);
  const [status, setStatus] = useState<Status>('select');
  const [checkoutIntent, setCheckoutIntent] = useState<CreateIntentResponse | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  const createIntent = useCreateSubscriptionIntent();

  const handleSubscribe = async () => {
    setStatus('processing');
    try {
      // Step 1: Create payment intent on backend
      const intent = await createIntent.mutateAsync(selectedPlan.id);

      // Save post-payment redirect target so the fan returns directly to this creator's profile
      if (creatorUsername && typeof window !== 'undefined') {
        const handle = creatorUsername.replace(/^@+/, '');
        sessionStorage.setItem('post_payment_redirect', `/creator/${handle}`);
      }

      // Step 2: Open Direct UPI checkout modal (shows PhonePe, GPay, Paytm, QR, Copy UPI ID, and UTR entry)
      setCheckoutIntent(intent);
      setShowCheckoutModal(true);
      setStatus('select');
    } catch (err: unknown) {
      setStatus('error');
      const axiosError = err as AxiosError<{ error?: { message?: string }; detail?: string }>;
      const msg =
        axiosError.response?.data?.error?.message ||
        axiosError.response?.data?.detail ||
        (err as Error)?.message ||
        'Subscription failed. Please try again.';
      toast.error(msg);
    }
  };

  const isMembership = presentation === 'membership';
  const handleLabel = (creatorUsername ?? '').replace(/^@+/, '') || (creatorName || 'creator').replace(/\s/g, '').toLowerCase() || 'creator';
  const avatarSrc = creatorAvatarUrl?.trim()
    ? creatorAvatarUrl.startsWith('http') || creatorAvatarUrl.startsWith('data:')
      ? creatorAvatarUrl
      : getMediaUrl(creatorAvatarUrl) || creatorAvatarUrl
    : null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 sm:items-center"
      onClick={isMembership ? onClose : undefined}
    >
      <Card
        className="w-full max-w-md rounded-2xl"
        onClick={isMembership ? (e) => e.stopPropagation() : undefined}
      >
        {isMembership ? (
          <>
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-background">
                  {avatarSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-sm font-semibold text-white">
                      {(creatorName || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm font-medium text-foreground">@{handleLabel}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="size-5" />
              </Button>
            </div>
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarSrc ?? '/sample-media/id-card-1.png'}
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent" />
              <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-pink-500/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                Exclusive
              </span>
            </div>
          </>
        ) : (
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
              <Crown className="size-6 text-white" />
            </div>
            <CardTitle>Subscribe to {creatorName}</CardTitle>
            <CardDescription>Choose a plan to get exclusive access</CardDescription>
          </CardHeader>
        )}

        <CardContent className={cn('space-y-4', isMembership && 'space-y-0 px-0 pb-4 pt-0')}>
          {status === 'select' && (
            <>
              {/* Plan Picker */}
              <div className={cn(isMembership ? 'divide-y divide-border' : 'space-y-3')}>
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      'w-full text-left',
                      isMembership
                        ? cn(
                            'px-4 py-3.5',
                            selectedPlan.id === plan.id ? 'bg-primary/5' : 'hover:bg-muted/40'
                          )
                        : cn(
                            'rounded-xl border-2 p-4',
                            selectedPlan.id === plan.id
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/50'
                          )
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{plan.name}</p>
                        {!isMembership && plan.description ? (
                          <p className="mt-0.5 text-xs text-muted-foreground">{plan.description}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">{plan.duration_days} days access</p>
                      </div>
                      <div className="ml-4 flex-shrink-0 text-right">
                        <p className="text-lg font-bold">{formatCurrency(plan.price)}</p>
                        {selectedPlan.id === plan.id && (
                          <Check className="ml-auto mt-1 size-4 text-primary" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {!isMembership ? (
                <div className="space-y-2 rounded-xl bg-muted/40 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    What you get
                  </p>
                  {[
                    'Access to all exclusive content',
                    'Direct messaging with creator',
                    'Early access to new content',
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2 text-sm">
                      <Check className="size-3.5 shrink-0 text-primary" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing your subscription…</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <CheckCircle2 className="size-12 text-green-500" />
              <p className="font-semibold">You&apos;re subscribed!</p>
              <p className="text-sm text-muted-foreground">Enjoy exclusive access to {creatorName}&apos;s content.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <XCircle className="size-12 text-destructive" />
              <p className="font-semibold text-destructive">Something went wrong</p>
              <p className="text-sm text-muted-foreground">Please try again.</p>
            </div>
          )}
        </CardContent>

        <CardFooter className={cn('flex gap-2 pt-0', isMembership && 'px-4')}>
          {(status === 'select' || status === 'error') && (
            <>
              {!isMembership ? (
                <Button variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
              ) : null}
              <Button
                className={isMembership ? 'w-full' : 'flex-1'}
                onClick={status === 'error' ? () => setStatus('select') : handleSubscribe}
                style={{
                  background: 'linear-gradient(to right, var(--profile-gradient-start, #9333ea), var(--profile-gradient-end, #ec4899))',
                }}
              >
                {status === 'error' ? 'Try Again' : `Subscribe · ${formatCurrency(selectedPlan.price)}`}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <DirectUpiCheckoutModal
        isOpen={showCheckoutModal}
        intent={checkoutIntent}
        itemName={`Subscription: ${selectedPlan?.name || 'Plan'}`}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={() => {
          setShowCheckoutModal(false);
          setStatus('success');
          toast.success('Subscription activated successfully!');
          onSuccess?.();
          onClose();
        }}
      />
    </div>
  );
}
