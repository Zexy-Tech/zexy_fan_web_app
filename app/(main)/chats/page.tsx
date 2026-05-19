'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useConversations } from '@/hooks/useMessages';

function formatChatTimestamp(value: string) {
  const date = new Date(value);
  const now = new Date();

  const isSameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isSameDay) {
    return new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  return formatDate(value);
}

export default function ChatsPage() {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No conversations yet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="divide-y border-t border-b">
      {conversations.map((chat) => (
        <Link
          key={chat.other_user_id}
          href={`/chats/${chat.other_user_id}`}
          className="block cursor-pointer px-4 py-3 transition-colors hover:bg-accent/40"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0 overflow-hidden">
              {chat.other_user_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={chat.other_user_avatar} alt={chat.other_user_username || ''} className="h-full w-full object-cover" />
              ) : (
                chat.other_user_name?.[0] || chat.other_user_username?.[0] || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-semibold truncate">{chat.other_user_name || chat.other_user_username}</p>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {formatChatTimestamp(chat.last_message_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className={chat.unread_count > 0 ? "text-sm font-medium text-foreground truncate" : "text-sm text-muted-foreground truncate"}>
                  {chat.last_message}
                </p>
                {chat.unread_count > 0 && (
                  <span className="ml-2 flex-shrink-0 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-2 w-2 flex items-center justify-center" />
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
