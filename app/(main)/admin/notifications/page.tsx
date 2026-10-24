'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  Send,
  Sparkles,
  Users,
  ExternalLink,
  AlertTriangle,
  History,
  Eye,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { useAuthContext } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notificationService, type AdminBulkNotificationRequest } from '@/services/notifications';
import { fromUserCode } from '@/lib/userCode';

export default function AdminNotificationsPage() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [audience, setAudience] = useState<'all' | 'custom'>('all');
  const [targetedIdsInput, setTargetedIdsInput] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Queries & Mutations
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['admin', 'notifications'],
    queryFn: () => notificationService.listAdminAnnouncements(1, 20),
    enabled: user?.role === 'admin',
    staleTime: 15000,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: AdminBulkNotificationRequest) =>
      notificationService.sendAdminAnnouncement(payload),
    onSuccess: (data) => {
      toast.success(
        `Announcement dispatched! Targeted: ${data.users_targeted} recipients, Queued: ${data.notifications_queued}`
      );
      // Reset form
      setTitle('');
      setBody('');
      setActionUrl('');
      setTargetedIdsInput('');
      setIsConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { message?: string; response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ||
        (err as Error)?.message ||
        'Failed to dispatch announcement';
      toast.error(errorMsg);
    },
  });

  // Guard: Admin role required
  if (user && user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="p-4 bg-rose-500/10 rounded-2xl mb-4 border border-rose-500/20">
          <ShieldAlert className="size-10 text-rose-500" />
        </div>
        <h1 className="text-xl font-bold text-white">Admin Access Restricted</h1>
        <p className="text-sm text-zinc-400 mt-2 max-w-md">
          You must be an authenticated administrator to access the push announcement campaign console.
        </p>
      </div>
    );
  }

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Notification title is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Notification body is required');
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleSend = () => {
    const payload: AdminBulkNotificationRequest = {
      title: title.trim(),
      body: body.trim(),
      action_url: actionUrl.trim() || undefined,
    };

    if (audience === 'custom' && targetedIdsInput.trim()) {
      const ids = targetedIdsInput
        .split(',')
        .map((s) => fromUserCode(s.trim()) ?? parseInt(s.trim(), 10))
        .filter((n) => typeof n === 'number' && !isNaN(n) && n > 0) as number[];
      if (ids.length > 0) {
        payload.targeted_ids = ids;
      }
    }

    sendMutation.mutate(payload);
  };

  const announcements = historyData?.items || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Sparkles className="size-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Push Campaign Management</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Compose and dispatch broadcast Web Push notifications to active fans across mobile and desktop
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Compose Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Send className="size-4 text-purple-400" />
                Compose Announcement
              </CardTitle>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleOpenConfirm} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Notification Title <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. New Creator Announcement"
                    maxLength={255}
                    required
                    className="bg-zinc-950 border-zinc-800 text-sm text-white focus:border-purple-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">{title.length} / 255 characters</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Notification Message <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="e.g. Your favourite creator has published new exclusive content."
                    maxLength={1000}
                    rows={4}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">{body.length} / 1000 characters</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Action URL / Deep Link (Optional)
                  </label>
                  <Input
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="e.g. /creators or /content/123"
                    className="bg-zinc-950 border-zinc-800 text-sm text-white focus:border-purple-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    When clicked, the notification will open or navigate to this path
                  </p>
                </div>

                {/* Audience Selection */}
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">
                    Target Audience
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAudience('all')}
                      className={`p-3 rounded-xl border text-left ${
                        audience === 'all'
                          ? 'border-purple-500 bg-purple-950/20 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="size-4 text-purple-400" />
                        <span className="text-xs font-semibold">All Active Fans</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Dispatch to all users with active registered tokens
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAudience('custom')}
                      className={`p-3 rounded-xl border text-left ${
                        audience === 'custom'
                          ? 'border-purple-500 bg-purple-950/20 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="size-4 text-purple-400" />
                        <span className="text-xs font-semibold">Specific User IDs</span>
                      </div>
                      <p className="text-[11px] text-zinc-500">
                        Target specific fan IDs for test or segmented campaigns
                      </p>
                    </button>
                  </div>

                  {audience === 'custom' && (
                    <div className="mt-3">
                      <Input
                        value={targetedIdsInput}
                        onChange={(e) => setTargetedIdsInput(e.target.value)}
                        placeholder="Comma-separated user codes or IDs (e.g. ZX-FN-0001, ZX-CR-0042, 1, 2)"
                        className="bg-zinc-950 border-zinc-800 text-xs text-white"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs h-10 px-5 rounded-xl shadow-lg shadow-purple-600/20"
                  >
                    <Send className="size-3.5 mr-2" />
                    Preview & Send
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                    className="border-zinc-800 bg-zinc-950 text-zinc-300 text-xs h-10 px-4 rounded-xl hover:bg-zinc-900"
                  >
                    <Eye className="size-3.5 mr-2" />
                    {isPreviewOpen ? 'Hide Mobile Preview' : 'Preview Push Card'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Notification Live Simulation Preview */}
        <div className="space-y-4">
          <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Eye className="size-3.5 text-zinc-400" />
                Live Mobile Push Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Phone notification card mockup */}
              <div className="rounded-2xl border border-zinc-700/60 bg-zinc-950/90 p-4 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="relative size-5 rounded-full overflow-hidden bg-purple-600 flex items-center justify-center">
                      <Image
                        src="/zexy_z_letter_logo_nobg.png"
                        alt="Zexy"
                        width={16}
                        height={16}
                        className="object-contain"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-zinc-300 tracking-wide">ZEXY</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">now</span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">
                    {title.trim() || 'Announcement Title Preview'}
                  </p>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {body.trim() || 'Your push notification message preview will appear here.'}
                  </p>
                  {actionUrl.trim() && (
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1 text-[11px] text-purple-400 font-medium">
                        Opens: {actionUrl.trim()} <ExternalLink className="size-2.5" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 text-center mt-3">
                Simulated Web Push banner on Android / iOS 16.4+ Lock Screen
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <AlertTriangle className="size-6 shrink-0" />
              <h2 className="text-base font-semibold text-white">Confirm Campaign Broadcast</h2>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to broadcast this push notification? This will immediately reach all registered fans:
            </p>

            <div className="my-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 space-y-1.5 text-xs">
              <p className="text-zinc-400">
                <span className="font-semibold text-white">Title:</span> {title}
              </p>
              <p className="text-zinc-400">
                <span className="font-semibold text-white">Message:</span> {body}
              </p>
              {actionUrl && (
                <p className="text-zinc-400">
                  <span className="font-semibold text-white">Action:</span> {actionUrl}
                </p>
              )}
              <p className="text-zinc-400">
                <span className="font-semibold text-white">Audience:</span>{' '}
                {audience === 'all' ? 'All eligible fans' : `Specific IDs: ${targetedIdsInput}`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsConfirmOpen(false)}
                disabled={sendMutation.isPending}
                className="border-zinc-800 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSend}
                disabled={sendMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs"
              >
                {sendMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Confirm & Send Broadcast'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast History & Delivery Statistics */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="size-4 text-purple-400" />
            <h2 className="text-base font-semibold text-white">Broadcast History & Statistics</h2>
          </div>
          <span className="text-xs text-zinc-500">{announcements.length} campaigns</span>
        </div>

        {isLoadingHistory ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-6 animate-spin text-purple-500" />
          </div>
        ) : announcements.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/30 p-8 text-center text-zinc-500 text-xs">
            No previous push campaigns found.
          </Card>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-900/40 border border-zinc-800 rounded-xl"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        item.status === 'sent'
                          ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                          : 'border-amber-500/40 text-amber-400 bg-amber-950/20'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-1">{item.body}</p>
                  <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                    <span>
                      Created: {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                    </span>
                    {item.action_url && (
                      <span className="text-purple-400 truncate max-w-xs">
                        URL: {item.action_url}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delivery Stats */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80">
                    <p className="text-[10px] text-zinc-500 uppercase">Targeted</p>
                    <p className="text-xs font-bold text-white">{item.users_targeted ?? 0}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
                    <p className="text-[10px] text-emerald-400 uppercase">Delivered</p>
                    <p className="text-xs font-bold text-emerald-300">
                      {item.successful_sends ?? 0}
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-rose-950/20 border border-rose-800/40">
                    <p className="text-[10px] text-rose-400 uppercase">Failed</p>
                    <p className="text-xs font-bold text-rose-300">{item.failed_sends ?? 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
