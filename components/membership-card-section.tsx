/**
 * Membership Card Section
 *
 * Displays subscription plans with a "Subscribe Now" button that opens a
 * full-screen subscription modal to handle the payment flow.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useAuthContext } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { MembershipPopup } from '@/components/membership-popup';
import type { SubscriptionPlan } from '@/services/subscriptions';

interface MembershipCardSectionProps {
  plans: SubscriptionPlan[];
  isSubscribed: boolean;
  creatorName?: string;
  creatorUsername?: string;
  creatorAvatarUrl?: string | null;
}

/**
 * Membership card section component
 *
 * @param plans - Array of membership plans
 * @param isSubscribed - Whether the current user is already subscribed
 * @param creatorName - Creator display name for the modal title
 */
export function MembershipCardSection({
  plans,
  isSubscribed,
  creatorName = 'this creator',
  creatorUsername,
  creatorAvatarUrl,
}: MembershipCardSectionProps) {
  const { isAuthenticated } = useAuthContext();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  const handleSubscribeClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setShowModal(true);
  };

  // ── Coming Soon empty state ──────────────────────────────────────────────
  if (!plans || plans.length === 0) {
    return (
      <div className="px-4 py-6">
        <Card className="border-2 overflow-hidden opacity-60" style={{ borderColor: 'var(--profile-primary)' }}>
          <div className="h-2" style={{ background: 'linear-gradient(to right, var(--profile-gradient-start), var(--profile-gradient-end))' }} />
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-muted-foreground" />
              <CardTitle className="text-2xl text-muted-foreground">Membership</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
              <Clock className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-semibold">Coming Soon</p>
                <p className="text-sm text-muted-foreground">
                  This creator hasn&apos;t set up membership plans yet.
                </p>
              </div>
            </div>
            <Button className="w-full h-12 text-base font-semibold" disabled>
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Primary plan (first active plan) ────────────────────────────────────
  const primaryPlan = plans[0];

  return (
    <>
      <div className="px-4 py-6 space-y-3">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-5 w-5" style={{ color: 'var(--profile-primary)' }} />
          <h2 className="text-xl font-bold">Membership</h2>
        </div>

        {/* Plan cards */}
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className="border-2 overflow-hidden"
            style={{ borderColor: plan.id === primaryPlan.id ? 'var(--profile-primary)' : undefined }}
          >
            {plan.id === primaryPlan.id && (
              <div
                className="h-1.5"
                style={{ background: 'linear-gradient(to right, var(--profile-gradient-start), var(--profile-gradient-end))' }}
              />
            )}

            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.id === primaryPlan.id && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                    style={{ background: 'var(--profile-primary)' }}>
                    Popular
                  </span>
                )}
              </div>
              {plan.description && (
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold" style={{ color: 'var(--profile-primary)' }}>
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-muted-foreground text-sm">/ {plan.duration_days} days</span>
              </div>

              {/* Benefits (only on primary card) */}
              {plan.id === primaryPlan.id && (
                <ul className="space-y-2">
                  {[
                    'Access to all exclusive content',
                    'Direct messaging with creator',
                    'Early access to new content',
                    'Exclusive community access',
                  ].map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'var(--profile-primary)' }} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Single Subscribe CTA */}
        <Button
          className="w-full h-12 text-base font-semibold mt-2"
          onClick={handleSubscribeClick}
          disabled={isSubscribed}
          style={
            isSubscribed
              ? undefined
              : {
                  background:
                    'linear-gradient(to right, var(--profile-gradient-start), var(--profile-gradient-end))',
                }
          }
        >
          {isSubscribed ? '✓ Already Subscribed' : 'Subscribe Now'}
        </Button>
      </div>

      {/* Subscription Modal */}
      {showModal && (
        <MembershipPopup
          open={showModal}
          creatorName={creatorName}
          creatorUsername={creatorUsername ?? creatorName.replace(/\s+/g, '').toLowerCase()}
          creatorAvatarUrl={creatorAvatarUrl ?? null}
          plans={plans}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            // Creator profile will re-fetch is_subscribed on next visit
          }}
        />
      )}
    </>
  );
}
