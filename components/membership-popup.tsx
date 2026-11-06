'use client';

import type { SubscriptionPlan } from '@/services/subscriptions';
import { SubscriptionModal } from '@/components/subscription-modal';

export interface MembershipPopupProps {
  open: boolean;
  creatorName: string;
  /** Handle for @username row (with or without leading @). */
  creatorUsername: string;
  /** Avatar image URL (absolute or API path). */
  creatorAvatarUrl?: string | null;
  plans: SubscriptionPlan[] | undefined;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * Membership upsell + subscribe flow for creator profiles.
 * Wraps {@link SubscriptionModal} with membership-focused copy and a high z-index overlay.
 */
export function MembershipPopup({
  open,
  creatorName,
  creatorUsername,
  creatorAvatarUrl,
  plans,
  onClose,
  onSuccess,
}: MembershipPopupProps) {
  if (!open || !plans?.length) return null;

  return (
    <SubscriptionModal
      presentation="membership"
      creatorName={creatorName}
      creatorUsername={creatorUsername}
      creatorAvatarUrl={creatorAvatarUrl}
      plans={plans}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}
