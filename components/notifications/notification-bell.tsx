'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/hooks/useAuth';
import { useUnreadNotificationsCount, usePushNotificationSetup } from '@/hooks/useNotifications';
import { NotificationCenter } from '@/components/notifications/notification-center';
import { SignupModal } from '@/components/auth/signup-modal';

export function NotificationBell() {
  const { isAuthenticated } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Initialize push notification listener & hook
  usePushNotificationSetup();

  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const handleClick = () => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          onClick={handleClick}
          className="relative size-9 text-muted-foreground hover:text-foreground"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>

        {isAuthenticated && (
          <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
        )}
      </div>

      <SignupModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
