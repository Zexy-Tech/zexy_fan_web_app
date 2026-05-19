'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MoreVertical, Send, Smile, Trash2, Loader2, MessageCircle, Heart, Bookmark, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TipModal } from '@/components/tip-modal';
import { useMessageThread, useSendMessage, useMarkAsRead } from '@/hooks/useMessages';
import { useAuthContext } from '@/hooks/useAuth';
import { useCreatorByIdentifier } from '@/hooks/useFeed';
import { getMediaUrl, cn } from '@/lib/utils';
import { VideoPlayer } from '@/components/content/video-player';
import { AudioPlayer } from '@/components/content/audio-player';
import { ImageViewer } from '@/components/content/image-viewer';
import { messageService, Message } from '@/services/messages';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function MediaBubble({ msg, onImageClick }: { msg: Message; onImageClick: (url: string) => void }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchUrl = async () => {
      if (!msg.media_url) return;
      
      // If already a public/external URL, use it directly
      if (msg.media_url.startsWith('http') || msg.media_url.startsWith('/media/public/')) {
        setSignedUrl(getMediaUrl(msg.media_url));
        setLoading(false);
        return;
      }

      try {
        const { url } = await messageService.getSignedMediaUrl(msg.id);
        if (active) {
            setSignedUrl(url);
            setLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch signed URL:', err);
        if (active) setLoading(false);
      }
    };

    fetchUrl();
    return () => { active = false; };
  }, [msg.id, msg.media_url]);

  if (loading) {
    return (
      <div className="flex h-32 w-full items-center justify-center bg-zinc-900 rounded-xl">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!signedUrl) {
    return (
      <div className="flex h-32 w-full items-center justify-center bg-zinc-900 rounded-xl border border-dashed border-white/10 text-zinc-500 text-xs">
        Failed to load media
      </div>
    );
  }

  if (msg.message_type === 'image') {
    return (
      <div className="mb-1 aspect-square w-full overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={signedUrl} 
          alt="Shared photo" 
          className="h-full w-full object-cover cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all" 
          onClick={() => onImageClick(signedUrl)}
        />
      </div>
    );
  }

  if (msg.message_type === 'video') {
    return (
      <div className="mb-1 px-1 pt-1 aspect-square w-full">
        <VideoPlayer 
          src={signedUrl} 
          poster={getMediaUrl(msg.media_thumbnail_url) || undefined}
          className="h-full w-full rounded-xl shadow-lg aspect-square"
          autoPlay={false}
          variant="basic"
        />
      </div>
    );
  }

  if (msg.message_type === 'audio') {
    return (
      <div className="px-1 pt-1 mb-1">
        <AudioPlayer src={signedUrl} className="w-full shadow-md" />
      </div>
    );
  }

  return null;
}

export default function ChatThreadPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const { user: me } = useAuthContext();

  const { data: messages, isLoading: messagesLoading } = useMessageThread(id);
  const { data: creator, isLoading: creatorLoading } = useCreatorByIdentifier(String(id));
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(49);
  const [lockTipAmount, setLockTipAmount] = useState(false);
  const [tipTitle, setTipTitle] = useState('Tip amount');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);
  /** When true, tip modal owns focus — do not steal it back into the composer. */
  const tipBlocksInputFocusRef = useRef(false);

  const focusMessageInput = () => {
    requestAnimationFrame(() => {
      messageInputRef.current?.focus({ preventScroll: true });
    });
  };

  const handleMessageInputBlur = () => {
    window.setTimeout(() => {
      if (tipBlocksInputFocusRef.current) return;
      messageInputRef.current?.focus({ preventScroll: true });
    }, 0);
  };
  const [creatorTipBannerVisible, setCreatorTipBannerVisible] = useState(true);

  const creatorTipRequest = useMemo(() => {
    const tipDemand = messages?.find(m => m.message_type === 'tip_demand' && !m.tip_paid);
    if (!tipDemand) return null;
    return {
        id: tipDemand.id,
        amount: tipDemand.tip_amount || 0,
        message: tipDemand.body || 'Creator requested a tip'
    };
  }, [messages]);

  useEffect(() => {
    if (!creatorTipRequest) {
      setCreatorTipBannerVisible(false);
      return;
    }
    setCreatorTipBannerVisible(true);
    const timer = window.setTimeout(() => setCreatorTipBannerVisible(false), 30_000);
    return () => window.clearTimeout(timer);
  }, [creatorTipRequest]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (messages && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.receiver_uid === me?.id && !lastMsg.read_at) {
            markAsReadMutation.mutate(lastMsg.id);
        }
    }
  }, [messages, me?.id]);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const node = menuContainerRef.current;
      if (node && !node.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [menuOpen]);

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({ creatorId: id, body: text });
    setDraft('');
    focusMessageInput();
  };

  const handleAddEmoji = () => {
    setDraft((prev) => `${prev}😊`);
    focusMessageInput();
  };

  const handleDeleteChat = () => {
    setMenuOpen(false);
  };

  const handleSendTip = (amount: number) => {
    setTipOpen(false);
    setLockTipAmount(false);
    focusMessageInput();
  };

  const openFreeTipPopup = () => {
    tipBlocksInputFocusRef.current = true;
    setLockTipAmount(false);
    setTipTitle('Tip amount');
    setTipAmount(49);
    setTipOpen(true);
  };

  const openRequestedTipPopup = () => {
    if (!creatorTipRequest) return;
    tipBlocksInputFocusRef.current = true;
    setTipAmount(creatorTipRequest.amount);
    setLockTipAmount(true);
    setTipTitle('Creator requested amount');
    setTipOpen(true);
  };

  if (messagesLoading || creatorLoading) {
    return (
      <div className="fixed inset-0 z-[80] h-dvh bg-black flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const partner = messages && messages.length > 0 ? 
                 (messages[0].sender_uid === me?.id ? 
                  { name: messages[0].receiver_name, username: messages[0].receiver_username } : 
                  { name: messages[0].sender_name, username: messages[0].sender_username }) :
                 { name: creator?.name, username: creator?.username };

  const partnerDisplayName = partner.name || partner.username || 'User';

  return (
    <div className="fixed inset-0 z-[80] h-dvh bg-black flex flex-col overflow-hidden text-white">
      {/* WhatsApp-like top bar */}
      <div className="border-b border-zinc-800 bg-black">
        <div className="flex items-center gap-3 px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/chats')}
            aria-label="Back"
            className="shrink-0 text-white hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <button
            type="button"
            onClick={() => partner.username && router.push(`/creator/${encodeURIComponent(partner.username)}`)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1 text-left transition-colors hover:bg-zinc-900/90 active:bg-zinc-800 sm:-ml-1 sm:px-1"
            aria-label={`Open ${partnerDisplayName}'s profile`}
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center font-semibold overflow-hidden border border-white/5">
              {creator?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={getMediaUrl(creator.avatar) || ''} 
                  alt={partnerDisplayName} 
                  className="h-full w-full object-cover" 
                />
              ) : (
                partnerDisplayName[0]
              )}
            </div>

            <div className="min-w-0">
              <p className="font-semibold leading-tight truncate text-white">{partnerDisplayName}</p>
              <p className="text-xs text-zinc-400 truncate">@{partner.username || 'user'}</p>
            </div>
          </button>

          <div className="relative shrink-0" ref={menuContainerRef}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Chat options"
              onClick={() => setMenuOpen((v) => !v)}
              className="text-white hover:bg-zinc-800"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>

            {menuOpen && (
              <div className="absolute right-0 top-10 z-30 min-w-[160px] rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-lg">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
                  onClick={handleDeleteChat}
                >
                  <Trash2 className="h-4 w-4 shrink-0" />
                  Delete Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-black p-3 space-y-4 pb-10">
        {messages && messages.length > 0 ? messages.map((msg) => {
          const isMe = msg.sender_uid === me?.id;
          const isTipDemand = msg.message_type === 'tip_demand';
          const isImage = msg.message_type === 'image';
          const isVideo = msg.message_type === 'video';
          const isAudio = msg.message_type === 'audio';
          const hasMedia = isImage || isVideo || isAudio;

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-1 py-1 overflow-hidden transition-all',
                  isMe
                    ? 'bg-zinc-800 text-white rounded-br-md shadow-lg shadow-black/20'
                    : isTipDemand ? 'bg-amber-600/20 border border-amber-500/30 text-white rounded-bl-md' : 'bg-zinc-900 border border-white/5 text-white rounded-bl-md shadow-md',
                  hasMedia && 'w-full max-w-[280px]'
                )}
              >
                {/* Media Content */}
                {hasMedia && <MediaBubble msg={msg} onImageClick={(url) => setPreviewImageUrl(url)} />}

                <div className="px-3 py-2">
                    {isTipDemand && (
                        <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                            <Smile className="h-3 w-3" />
                            Tip Request
                        </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                        {isTipDemand ? `${msg.body || 'Requested a tip'} - ₹${msg.tip_amount}` : msg.body}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-4">
                    <p className={`text-[10px] uppercase font-bold tracking-tighter ${isMe ? 'text-white/40' : 'text-white/30'}`}>
                        {formatTime(msg.created_at)}
                    </p>
                    {isMe && msg.read_at && (
                        <div className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-pink-500 uppercase">Read</span>
                            <div className="w-1 h-1 rounded-full bg-pink-500" />
                        </div>
                    )}
                    </div>
                </div>
              </div>
            </div>
          );
        }) : (
            <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40">
                <MessageCircle className="h-12 w-12 mb-4" />
                <p className="text-sm">Start a conversation with {partnerDisplayName}</p>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Bottom input bar */}
      <div className="shrink-0 border-t border-zinc-800 bg-black p-2 pb-6">
        <div
        className={`mb-2 flex w-full items-center gap-2 ${
          creatorTipRequest && creatorTipBannerVisible ? 'justify-between' : 'justify-end'
        }`}
      >
        {creatorTipRequest && creatorTipBannerVisible && (
          <button
            type="button"
            onClick={openRequestedTipPopup}
            className="rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-left text-xs font-medium text-amber-200 whitespace-nowrap sm:text-sm"
          >
            {creatorTipRequest.message}
            <span className="text-amber-200/80"> · Tap to pay</span>
          </button>
        )}
  
        <button
          type="button"
          onClick={openFreeTipPopup}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink-600 text-base font-bold text-white shadow-md hover:bg-pink-500"
          aria-label="Send tip"
        >
          ₹
        </button>
      </div>


        <div className="relative flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Emoji"
            onClick={handleAddEmoji}
            className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Smile className="h-5 w-5" />
          </Button>
          <Input
            ref={messageInputRef}
            placeholder="Type a message"
            autoFocus
            spellCheck={false}
            className="flex-1 border-zinc-700 bg-zinc-900 text-white caret-white placeholder:text-zinc-500 selection:bg-pink-500/40"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleMessageInputBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            aria-label="Send"
            onClick={handleSend}
            disabled={!draft.trim() || sendMessageMutation.isPending}
            className="bg-pink-600 text-white hover:bg-pink-500 disabled:opacity-40"
          >
            {sendMessageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <TipModal
        open={tipOpen}
        amount={tipAmount}
        onAmountChange={setTipAmount}
        onClose={() => {
          tipBlocksInputFocusRef.current = false;
          setTipOpen(false);
          setLockTipAmount(false);
          setTipTitle('Tip amount');
          focusMessageInput();
        }}
        onSend={handleSendTip}
        lockAmount={lockTipAmount}
        title={tipTitle}
      />

      <ImageViewer 
        open={!!previewImageUrl} 
        src={previewImageUrl || ''} 
        alt="Chat Image"
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  );
}
