/**
 * Action Buttons Section
 * 
 * Displays customizable action buttons (Brand Enquiry, Chat Now, etc.)
 */

'use client';

import { ActionButton } from '@/types/creator-profile';
import { Button } from '@/components/ui/button';
import { useActionButton } from '@/hooks/useActionButton';
import { Mail, MessageCircle, ExternalLink, Send } from 'lucide-react';

const DEFAULT_CHAT_BUTTON: ActionButton = {
  id: 'message-creator-subscribed',
  label: 'Message',
  type: 'chat',
  action: 'chat',
  icon: 'MessageCircle',
  style: 'secondary',
};

function buildVisibleButtons(
  buttons: ActionButton[],
  isSubscribed: boolean | undefined
): ActionButton[] {
  const filtered = buttons.filter(
    (b) => b.type !== 'chat' || isSubscribed === true
  );
  const hasChat = filtered.some((b) => b.type === 'chat');
  if (isSubscribed === true && !hasChat) {
    return [DEFAULT_CHAT_BUTTON, ...filtered];
  }
  return filtered;
}

interface ActionButtonsSectionProps {
  buttons: ActionButton[];
  /** Routes "Chat" to `/messages/{creatorId}` when provided. */
  creatorId?: number;
  /** Only subscribers can message creators (API enforces too). */
  isSubscribed?: boolean;
}

/**
 * Get icon component by name
 */
function getIcon(iconName?: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Mail,
    MessageCircle,
    ExternalLink,
    Send,
  };
  
  return icons[iconName || 'ExternalLink'] || ExternalLink;
}

/**
 * Action buttons section component
 * 
 * @param buttons - Array of action button configurations
 */
export function ActionButtonsSection({
  buttons,
  creatorId,
  isSubscribed,
}: ActionButtonsSectionProps) {
  const { handleButtonClick } = useActionButton({ creatorId });

  const visible = buildVisibleButtons(buttons || [], isSubscribed);

  if (!visible.length) {
    return null;
  }

  return (
    <div className="px-4 py-6 space-y-3">
      {visible.map((button) => {
        const Icon = getIcon(button.icon);
        const variant = button.style === 'primary' ? 'default' : 
                       button.style === 'secondary' ? 'secondary' : 
                       'outline';
        
        return (
          <Button
            key={button.id}
            variant={variant}
            className="w-full h-12 text-sm"
            onClick={() => handleButtonClick(button)}
            style={{
              background: button.style === 'primary' 
                ? 'linear-gradient(to right, var(--profile-gradient-start), var(--profile-gradient-end))'
                : undefined,
            }}
          >
            <Icon className="mr-2 h-5 w-5" />
            {button.label}
          </Button>
        );
      })}
    </div>
  );
}
