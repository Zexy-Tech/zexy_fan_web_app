import { useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { messageService } from '@/services/messages';
import { paymentService } from '@/services/payment';
import { queryClient } from '@/lib/queryClient';
import { useAuthContext } from '@/hooks/useAuth';
import { mapMessageToConversationPreview } from '@/lib/message-conversations';
import { subscribeToThread, subscribeToConversations } from '@/services/firebase-chat';
import { ENV } from '@/constants/env';

export function useConversations() {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      const rows = await messageService.getConversations();
      if (!user) return [];
      return rows.map((m) => mapMessageToConversationPreview(m, user.id));
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user?.id) return;
    const unsub = subscribeToConversations(user.id, (realtimeConvos) => {
      if (!realtimeConvos) return;
      queryClient.setQueryData(
        ['conversations', user.id],
        realtimeConvos.map((m) => mapMessageToConversationPreview(m, user.id))
      );
    });

    return () => {
      if (unsub) unsub();
    };
  }, [user?.id]);

  return query;
}

export function useMessageThread(creatorId: number) {
  const { user } = useAuthContext();

  const query = useQuery({
    queryKey: ['messages', 'thread', creatorId],
    queryFn: () => messageService.getThread(creatorId),
    enabled: !!creatorId,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!user?.id || !creatorId) return;
    const unsub = subscribeToThread(user.id, creatorId, (realtimeMessages) => {
      if (!realtimeMessages) return;
      const visible = realtimeMessages.filter((m) => !m.is_deleted);
      queryClient.setQueryData(['messages', 'thread', creatorId], visible);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [user?.id, creatorId]);

  return query;
}

export function useDeleteMessage() {
  return useMutation({
    mutationFn: ({ messageId }: { messageId: number }) => messageService.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'thread'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useClearChat() {
  return useMutation({
    mutationFn: ({ creatorId }: { creatorId: number }) => messageService.clearChat(creatorId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'thread', variables.creatorId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ creatorId, body }: { creatorId: number; body: string }) =>
      messageService.sendMessage(creatorId, body),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'thread', variables.creatorId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMediaMessage() {
  return useMutation({
    mutationFn: ({ creatorId, ...params }: { creatorId: number; message_type: string; media_url: string; media_mime_type: string; media_size_bytes: number; body?: string }) =>
      messageService.sendMediaMessage(creatorId, params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'thread', variables.creatorId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkAsRead() {
  return useMutation({
    mutationFn: (messageId: number) => messageService.markAsRead(messageId),
  });
}

/** Pay a chat tip demand: create intent → verify (Razorpay step simulated like other fan modals until checkout is wired). */
export function usePayTipDemand(creatorId: number) {
  return useMutation({
    mutationFn: async (messageId: number) => {
      const intent = await messageService.createTipDemandIntent(messageId);
      await new Promise((r) => setTimeout(r, ENV.IS_MOCK ? 800 : 1200));
      return paymentService.verifyPayment({
        gateway_order_id: intent.gateway_order_id,
        gateway_payment_id: 'pay_web_' + Date.now(),
        gateway_signature: 'sig_web_' + Date.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'thread', creatorId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
