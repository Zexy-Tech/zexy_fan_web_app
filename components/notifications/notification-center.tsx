'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CheckCheck,
  Radio,
  Video,
  MessageSquare,
  Sparkles,
  ShieldAlert,
  CreditCard,
  Trash2,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  useFanNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import type { FanNotificationItem } from '@/services/notifications';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const router = useRouter();
  const [category, setCategory] = useState<'all' | 'creator' | 'admin'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading, isError } = useFanNotifications(1, 20, unreadOnly, category);
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  if (!isOpen) return null;

  const notifications = data?.items || [];
  const unreadCount = data?.unread_count ?? 0;

  const handleNotificationClick = (item: FanNotificationItem) => {
    if (!item.is_read) {
      markAsRead.mutate(item.id);
    }
    if (item.action_url) {
      onClose();
      router.push(item.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'creator_live':
        return <Radio className="size-4 text-rose-500" />;
      case 'creator_content':
        return <Video className="size-4 text-purple-400" />;
      case 'new_message':
        return <MessageSquare className="size-4 text-blue-400" />;
      case 'account':
      case 'subscription':
        return <CreditCard className="size-4 text-emerald-400" />;
      case 'announcement':
        return <Sparkles className="size-4 text-amber-400" />;
      default:
        return <Bell className="size-4 text-zinc-400" />;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Popover / Panel */}
      <div
        className="fixed right-2 top-16 z-50 w-full max-w-sm sm:max-w-md rounded-2xl border border-border bg-popover text-popover-foreground p-4 shadow-2xl backdrop-blur-xl"
        style={{ maxHeight: 'calc(100vh - 5rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="default" className="bg-purple-600 text-white hover:bg-purple-600">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                title="Mark all as read"
              >
                <CheckCheck className="size-3.5 mr-1" />
                Mark read
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Filter Tabs: All, Creator, Admin + Unread */}
        <div className="flex items-center justify-between gap-1 pt-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium',
                category === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setCategory('creator')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium',
                category === 'creator'
                  ? 'bg-purple-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              Creator
            </button>
            <button
              type="button"
              onClick={() => setCategory('admin')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium',
                category === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              Admin
            </button>
          </div>

          <button
            type="button"
            onClick={() => setUnreadOnly((prev) => !prev)}
            className={cn(
              'px-2 py-0.5 rounded-md text-[11px] font-medium border',
              unreadOnly
                ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            Unread
          </button>
        </div>

        {/* List Body */}
        <div className="overflow-y-auto space-y-2 py-2 pr-1" style={{ maxHeight: '55vh' }}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="size-6 animate-spin mb-2" />
              <p className="text-xs">Loading notifications...</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <ShieldAlert className="size-8 text-rose-500 mb-2" />
              <p className="text-xs">Failed to load notifications</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="p-3 bg-muted rounded-full mb-3">
                <Bell className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {unreadOnly ? "You're all caught up!" : "Updates from creators and events will appear here"}
              </p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={cn(
                  'group relative flex items-start gap-3 rounded-xl p-3 text-left cursor-pointer border',
                  item.is_read
                    ? 'bg-muted/30 border-border/50 hover:bg-muted/70 hover:border-border'
                    : 'bg-purple-500/10 border-purple-500/25 hover:bg-purple-500/15 hover:border-purple-500/40'
                )}
              >
                {/* Icon or Creator Avatar */}
                <div className="shrink-0 mt-0.5">
                  {item.creator?.avatar_url ? (
                    <div className="relative size-9 rounded-full overflow-hidden border border-border">
                      <Image
                        src={item.creator.avatar_url}
                        alt={item.creator.name || 'Creator'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted border border-border">
                      {getNotificationIcon(item.type)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
                    {!item.is_read && (
                      <span className="size-2 rounded-full bg-purple-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>

                {/* Actions: Dismiss */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification.mutate(item.id);
                  }}
                  className="absolute right-2 top-2 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-rose-500"
                  title="Dismiss notification"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-3 mt-1 flex items-center justify-between">
          <Link
            href="/notifications"
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium"
          >
            <span>View all history</span>
            <ExternalLink className="size-3" />
          </Link>

          <Link
            href="/settings"
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Notification settings
          </Link>
        </div>
      </div>
    </>
  );
}
