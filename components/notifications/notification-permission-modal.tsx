'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  AlertCircle,
  X,
  Radio,
  Video,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/hooks/useAuth';
import { usePushNotificationSetup } from '@/hooks/useNotifications';
import { notificationService } from '@/services/notifications';

const SESSION_DISMISSED_KEY = 'zexy_notif_modal_dismissed';

export function NotificationPermissionModal() {
  const { isAuthenticated } = useAuthContext();
  const { enablePushNotifications, isRegistering } = usePushNotificationSetup();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'request' | 'denied'>('request');
  const [showHowTo, setShowHowTo] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // Initialize and check permission on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Session guard: if user already interacted during this session, do not reopen on route changes
    const isSessionDismissed = sessionStorage.getItem(SESSION_DISMISSED_KEY);
    if (isSessionDismissed === 'true') {
      return;
    }

    if (!('Notification' in window)) {
      return;
    }

    const currentPerm = Notification.permission;

    if (currentPerm === 'granted') {
      // Permission already granted, never show popup
      setIsOpen(false);
      return;
    }

    // Delay slightly after hydration so user isn't immediately jarred on render
    const timer = setTimeout(() => {
      if (currentPerm === 'denied') {
        setMode('denied');
        setIsOpen(true);
      } else if (currentPerm === 'default') {
        setMode('request');
        setIsOpen(true);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
    setIsOpen(false);

    // Record dismissal in database if authenticated
    if (isAuthenticated) {
      void notificationService.updatePermissionStatus(mode === 'denied' ? 'denied' : 'dismissed');
    }
  }, [isAuthenticated, mode]);

  const handleAllow = async () => {
    const success = await enablePushNotifications();
    if (success) {
      sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
      setIsOpen(false);
    } else {
      if (typeof window !== 'undefined' && Notification.permission === 'denied') {
        setMode('denied');
        setShowHowTo(true);
      }
    }
  };

  const handleRecheckPermission = async () => {
    setIsChecking(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const success = await enablePushNotifications();
        if (success) {
          sessionStorage.setItem(SESSION_DISMISSED_KEY, 'true');
          setIsOpen(false);
        }
      } else {
        setShowHowTo(true);
      }
    }
    setIsChecking(false);
  };

  // Keyboard navigation: Escape key dismisses
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDismiss]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notif-modal-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-border bg-card text-card-foreground p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close dialog"
        >
          <X className="size-4" />
        </button>

        {mode === 'request' ? (
          /* ================= REQUEST VIEW (DEFAULT PERMISSION) ================= */
          <div className="space-y-5">
            {/* Header with Glowing Icon */}
            <div className="flex items-center gap-3.5">
              <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg shadow-purple-600/30">
                <Bell className="size-6 text-white" />
                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 ring-2 ring-background" />
              </div>
              <div>
                <h2 id="notif-modal-title" className="text-lg font-bold tracking-tight text-foreground">
                  Never Miss an Update!
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Stay connected with your favourite creators</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enable notifications to get real-time alerts for live sessions, new content drops, direct messages, and important announcements even when you&apos;re not on the website.
            </p>

            {/* Benefit Highlights */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border border-border">
                <div className="p-1 rounded-md bg-rose-500/10 text-rose-500 shrink-0">
                  <Radio className="size-3.5" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Creator Live Alerts</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border border-border">
                <div className="p-1 rounded-md bg-purple-500/10 text-purple-500 shrink-0">
                  <Video className="size-3.5" />
                </div>
                <span className="text-[11px] font-medium text-foreground">New Content Drops</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border border-border">
                <div className="p-1 rounded-md bg-blue-500/10 text-blue-500 shrink-0">
                  <MessageSquare className="size-3.5" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Chat Replies</span>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/60 border border-border">
                <div className="p-1 rounded-md bg-amber-500/10 text-amber-500 shrink-0">
                  <Sparkles className="size-3.5" />
                </div>
                <span className="text-[11px] font-medium text-foreground">Announcements</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={handleAllow}
                disabled={isRegistering}
                className="w-full h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/25"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Enabling Notifications...
                  </>
                ) : (
                  'Allow Notifications'
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleDismiss}
                className="w-full h-9 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
              >
                Not Now
              </Button>
            </div>
          </div>
        ) : (
          /* ================= DENIED / BLOCKED VIEW ================= */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                <AlertCircle className="size-6" />
              </div>
              <div>
                <h2 id="notif-modal-title" className="text-base font-bold text-foreground">
                  Notifications Are Blocked
                </h2>
                <Badge variant="outline" className="border-rose-500/40 text-rose-500 text-[10px] mt-0.5">
                  Action Required
                </Badge>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Notifications are currently blocked in your browser settings. To receive updates from your favourite creators, please allow notifications.
            </p>

            {/* Expandable How To Enable Guide */}
            <div className="rounded-xl border border-border bg-muted/40 p-3 text-xs space-y-2">
              <button
                type="button"
                onClick={() => setShowHowTo(!showHowTo)}
                className="flex items-center justify-between w-full font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <span>How to Enable in Browser Settings</span>
                {showHowTo ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
              </button>

              {showHowTo && (
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground text-[11px] pt-1 leading-relaxed">
                  <li>
                    Click the <span className="font-semibold text-foreground">lock/tune icon (🔒)</span> next to the URL in your address bar.
                  </li>
                  <li>
                    Look for <span className="font-semibold text-foreground">Notifications</span> and toggle it to <span className="font-semibold text-emerald-500">&ldquo;Allow&rdquo;</span>.
                  </li>
                  <li>
                    On iOS Safari: Tap <span className="font-semibold text-foreground">Share</span> -&gt; <span className="font-semibold text-foreground">&ldquo;Add to Home Screen&rdquo;</span>, then launch Zexy from your home screen.
                  </li>
                  <li>Tap &ldquo;Check Again&rdquo; below once changed.</li>
                </ol>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <Button
                type="button"
                onClick={handleRecheckPermission}
                disabled={isChecking}
                className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/20"
              >
                {isChecking ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Checking Permission...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-3.5 mr-2" />
                    Check Again
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={handleDismiss}
                className="w-full h-9 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
              >
                Not Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
