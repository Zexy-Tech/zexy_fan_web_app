/**
 * Action Button Handler Hook
 * 
 * Handles clicks on action buttons with authentication checks.
 */

'use client';

import { useAuthContext } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ActionButton } from '@/types/creator-profile';
import { toast } from 'sonner';

export interface UseActionButtonOptions {
  /** When set, chat buttons open `/messages/{creatorId}` instead of raw `action`. */
  creatorId?: number;
}

/**
 * Hook for handling action button clicks
 *
 * @example
 * const { handleButtonClick } = useActionButton({ creatorId: creator.id });
 */
export function useActionButton(options?: UseActionButtonOptions) {
  const { isAuthenticated } = useAuthContext();
  const { push } = useRouter();
  const creatorId = options?.creatorId;

  const handleButtonClick = (button: ActionButton) => {
    if (button.type === 'chat' && !isAuthenticated) {
      const chatPath =
        creatorId != null ? `/messages/${creatorId}` : button.action.startsWith('/')
          ? button.action
          : '/messages';
      push(`/login?next=${encodeURIComponent(chatPath)}`);
      return;
    }

    switch (button.type) {
      case 'brand_enquiry':
      case 'email':
        // Open email client
        window.location.href = `mailto:${button.action}`;
        break;

      case 'chat': {
        if (creatorId != null) {
          push(`/messages/${creatorId}`);
        } else if (button.action && button.action !== 'chat') {
          push(button.action.startsWith('/') ? button.action : `/${button.action}`);
        } else {
          push('/messages');
        }
        break;
      }

      case 'custom_link':
        // Open external link in new tab
        window.open(button.action, '_blank', 'noopener,noreferrer');
        break;

      default:
        console.warn('Unknown button type:', button.type);
        toast.error('Action not supported');
    }
  };

  return { handleButtonClick };
}
