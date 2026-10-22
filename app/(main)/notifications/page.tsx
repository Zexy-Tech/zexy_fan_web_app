'use client';

import { useState } from 'react';
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
  CreditCard,
  Trash2,
  ExternalLink,
  Loader2,
  Settings,
  Users,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  useFanNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from '@/hooks/useNotifications';
import type { FanNotificationItem } from '@/services/notifications';

type CategoryFilter = 'all' | 'creator' | 'admin';

export default function NotificationsPage() {
  const router = useRouter();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Always fetch latest 20 notifications
  const { data, isLoading, isError } = useFanNotifications(1, 20, unreadOnly, category);
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.items || [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unread_count ?? 0;

  const handleNotificationClick = (item: FanNotificationItem) => {
    if (!item.is_read) {
      markAsRead.mutate(item.id);
    }
    if (item.action_url) {
      router.push(item.action_url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'creator_live':
        return <Radio className="size-5 text-rose-500 animate-pulse" />;
      case 'creator_content':
        return <Video className="size-5 text-purple-400" />;
      case 'new_message':
        return <MessageSquare className="size-5 text-blue-400" />;
      case 'account':
      case 'subscription':
        return <CreditCard className="size-5 text-emerald-400" />;
      case 'announcement':
        return <Sparkles className="size-5 text-amber-400" />;
      default:
        return <Bell className="size-5 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <Badge className="bg-purple-600 hover:bg-purple-600 text-white font-semibold">
                {unreadCount} unread
              </Badge>
            )}
            <Badge variant="outline" className="border-border bg-muted text-muted-foreground text-[10px] hidden sm:inline-flex">
              Latest 20 kept
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Displaying the 20 most recent notifications. Older notifications are automatically deleted.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="border-border bg-card text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <CheckCheck className="size-3.5 mr-1.5" />
              Mark all as read
            </Button>
          )}

          <Link href="/settings">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Settings className="size-3.5 mr-1.5" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs: All, Creator, Admin + Unread Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border p-2 rounded-2xl shadow-sm">
        {/* Main Category Filters */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
              category === 'all'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Bell className="size-3.5" />
            <span>All</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory('creator')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
              category === 'creator'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Users className="size-3.5" />
            <span>Creator</span>
          </button>

          <button
            type="button"
            onClick={() => setCategory('admin')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all',
              category === 'admin'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <Sparkles className="size-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Unread Toggle */}
        <button
          type="button"
          onClick={() => setUnreadOnly((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
            unreadOnly
              ? 'bg-purple-500/15 border-purple-500 text-purple-600 dark:text-purple-300'
              : 'border-border bg-background text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          <span className={cn('size-1.5 rounded-full', unreadOnly ? 'bg-purple-500' : 'bg-muted-foreground')} />
          <span>Unread Only</span>
        </button>
      </div>

      {/* Notification List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="size-8 animate-spin mb-3 text-purple-500" />
            <p className="text-sm font-medium text-muted-foreground">Loading notifications...</p>
          </div>
        ) : isError ? (
          <Card className="border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-500">
            <p className="text-sm font-medium">Unable to load notifications right now.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="mt-4 border-rose-500/40 text-xs text-rose-500 hover:bg-rose-500/20"
            >
              Try Again
            </Button>
          </Card>
        ) : notifications.length === 0 ? (
          <Card className="border-border bg-card p-12 text-center shadow-sm">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted mb-4 border border-border">
              {category === 'creator' ? (
                <Users className="size-6 text-muted-foreground" />
              ) : category === 'admin' ? (
                <ShieldCheck className="size-6 text-muted-foreground" />
              ) : (
                <Bell className="size-6 text-muted-foreground" />
              )}
            </div>
            <h3 className="text-base font-semibold text-foreground">
              {category === 'creator'
                ? 'No creator notifications'
                : category === 'admin'
                ? 'No admin announcements'
                : 'No notifications'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {unreadOnly
                ? "You don't have any unread notifications in this category."
                : category === 'creator'
                ? 'New content, live alerts, and creator replies will appear here.'
                : category === 'admin'
                ? 'Platform announcements and maintenance alerts will appear here.'
                : 'Stay tuned for live streams, new posts, and updates from your creators!'}
            </p>
          </Card>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => handleNotificationClick(item)}
              className={cn(
                'group relative flex items-start gap-4 rounded-xl p-4 transition-all cursor-pointer border',
                item.is_read
                  ? 'bg-card border-border hover:bg-muted/60'
                  : 'bg-purple-500/10 border-purple-500/25 hover:border-purple-500/40 shadow-sm'
              )}
            >
              {/* Creator Avatar or Category Icon */}
              <div className="shrink-0">
                {item.creator?.avatar_url ? (
                  <div className="relative size-11 rounded-full overflow-hidden border border-border shadow-inner">
                    <Image
                      src={item.creator.avatar_url}
                      alt={item.creator.name || 'Creator'}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-xl bg-muted border border-border">
                    {getNotificationIcon(item.type)}
                  </div>
                )}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-foreground truncate">{item.title}</span>
                  {!item.is_read && (
                    <span className="size-2 rounded-full bg-purple-500 shrink-0 animate-pulse" />
                  )}
                  {item.creator?.name ? (
                    <Badge variant="outline" className="border-border text-[10px] text-muted-foreground py-0 h-4">
                      {item.creator.name}
                    </Badge>
                  ) : item.type === 'admin' || item.reference_type === 'announcement' ? (
                    <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-[10px] py-0 h-4">
                      Admin
                    </Badge>
                  ) : null}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>

                <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                  <span>
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                  {item.action_url && (
                    <span className="flex items-center gap-0.5 text-purple-600 dark:text-purple-400 hover:underline font-medium">
                      Open <ExternalLink className="size-2.5" />
                    </span>
                  )}
                </div>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification.mutate(item.id);
                }}
                className="absolute right-3 top-3 p-1.5 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-rose-500 transition-all"
                title="Dismiss"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer Info: Latest 20 auto-deletion status */}
      <div className="flex items-center justify-between border-t border-border pt-4 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 text-muted-foreground" />
          <span>Showing {notifications.length} of latest {total > 20 ? 20 : total} notifications</span>
        </div>
        <span>Older items are automatically cleaned</span>
      </div>
    </div>
  );
}
