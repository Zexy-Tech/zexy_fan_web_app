import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentService, type CreateIntentRequest, type VerifyPaymentRequest } from '@/services/payment';

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: (data: CreateIntentRequest) => paymentService.createIntent(data),
  });
}

export function useVerifyPayment() {
  return useMutation({
    mutationFn: (data: VerifyPaymentRequest) => paymentService.verifyPayment(data),
  });
}

export function useOrderStatus(gatewayOrderId: string | null | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['payments', 'order-status', gatewayOrderId],
    queryFn: () => paymentService.getOrderStatus(gatewayOrderId!),
    enabled: !!gatewayOrderId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'pending') return 2500;
      return false;
    },
  });
}

export function useSubmitUtr() {
  return useMutation({
    mutationFn: ({ gatewayOrderId, utr }: { gatewayOrderId: string; utr: string }) =>
      paymentService.submitUtr(gatewayOrderId, utr),
  });
}

export function usePendingPayments(status: string = 'created', limit: number = 50, offset: number = 0) {
  return useQuery({
    queryKey: ['admin', 'payments', 'pending', status, limit, offset],
    queryFn: () => paymentService.getPendingPayments(status, limit, offset),
    refetchInterval: 10000,
  });
}

export function useVerifyPaymentAdmin() {
  return useMutation({
    mutationFn: ({
      gatewayOrderId,
      action,
      bankReference,
      notes,
    }: {
      gatewayOrderId: string;
      action: 'approve' | 'reject';
      bankReference?: string;
      notes?: string;
    }) => paymentService.verifyPaymentAdmin(gatewayOrderId, action, bankReference, notes),
  });
}

