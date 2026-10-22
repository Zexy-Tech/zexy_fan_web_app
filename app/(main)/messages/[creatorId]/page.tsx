'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/hooks/useAuth';
import { useCreatorByIdentifier } from '@/hooks/useFeed';
import { useMessageThread, useSendMessage } from '@/hooks/useMessages';
import { TipDemandMessage } from '@/components/messages/tip-demand-message';
import { MediaMessage } from '@/components/messages/media-message';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ENV } from '@/constants/env';
import { toUserCode, fromUserCode } from '@/lib/userCode';

export default function MessageThreadPage() {
  const params = useParams();
  const rawCreatorId = typeof params.creatorId === 'string' ? params.creatorId : String(params.creatorId ?? '');
  const creatorId = fromUserCode(rawCreatorId) ?? Number(rawCreatorId);
  const { user } = useAuthContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('');

  const identifier = rawCreatorId || (Number.isFinite(creatorId) ? String(creatorId) : undefined);
  const { data: creator } = useCreatorByIdentifier(identifier);
  const { data: messages, isLoading, error } = useMessageThread(
    Number.isFinite(creatorId) ? creatorId : 0
  );
  const sendMessage = useSendMessage();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const body = text.trim();
    if (!body || !Number.isFinite(creatorId)) return;
    try {
      await sendMessage.mutateAsync({ creatorId, body });
      setText('');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: { message?: string } } } };
      const msg = err.response?.data?.error?.message || 'Could not send message';
      toast.error(msg);
    }
  };

  const userCode = creator?.user_code || (Number.isFinite(creatorId) ? toUserCode(creatorId, 'creator') : '');
  const displayName = creator?.name || creator?.username || userCode || 'Creator';

  if (!Number.isFinite(creatorId)) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">Invalid conversation</div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] -mx-4 -my-6">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b px-4 py-3 flex items-center gap-3">
        <Link
          href="/messages"
          className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Back to messages"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{displayName}</p>
          {creator?.username ? (
            <p className="text-xs text-muted-foreground truncate">@{creator.username}</p>
          ) : null}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28 space-y-3">
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <p className="text-center text-destructive text-sm">Failed to load messages</p>
        )}
        {!isLoading &&
          messages &&
          messages.length === 0 &&
          !error && (
            <p className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Say hi below — you need an active subscription to message this creator.
            </p>
          )}
        {messages?.map((m) => {
          const mine = !!user && m.sender_uid === user.id;
          if (m.message_type === 'tip_demand') {
            return (
              <TipDemandMessage
                key={m.id}
                message={m}
                creatorId={creatorId}
                creatorDisplayName={displayName}
                mine={mine}
              />
            );
          }
          if (m.message_type === 'image' || m.message_type === 'video' || m.message_type === 'audio') {
            return <MediaMessage key={m.id} message={m} mine={mine} apiBaseUrl={ENV.API_BASE_URL} />;
          }
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm',
                  mine
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md border border-border/50'
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p
                  className={cn(
                    'text-[10px] mt-1 opacity-80',
                    mine ? 'text-right text-white/90' : 'text-left text-muted-foreground'
                  )}
                >
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="sticky bottom-16 bg-background border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form
          className="flex gap-2 max-w-4xl mx-auto w-full"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSend();
          }}
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Message…"
            className="flex-1 bg-muted/50"
            disabled={sendMessage.isPending}
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={sendMessage.isPending || !text.trim()}>
            {sendMessage.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
