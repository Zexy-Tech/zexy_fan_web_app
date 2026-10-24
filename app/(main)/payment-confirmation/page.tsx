'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVerifyPayment, useOrderStatus } from '@/hooks/usePayment';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function PaymentConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { mutateAsync: verifyPaymentMutate } = useVerifyPayment();
  
  const [errorMsg, setErrorMsg] = useState('');
  const [destinationUrl, setDestinationUrl] = useState<string>('/membership');
  const hasTriggeredInitialVerify = useRef(false);

  // Extract from query parameters (supports both PhonePe redirect and custom callbacks)
  const orderId = searchParams.get('order_id') || searchParams.get('merchantTransactionId');
  const paymentId = searchParams.get('payment_id') || searchParams.get('transactionId') || 'pay_phonepe';
  const gatewayStatus = searchParams.get('status') || searchParams.get('code');

  // Query authoritative order status from backend with auto-polling for pending transactions
  const { data: orderData, isLoading: orderLoading } = useOrderStatus(orderId);

  useEffect(() => {
    // Resolve post-payment redirect destination
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem('post_payment_redirect') : null;
    const returnTo = searchParams.get('return_to') || stored || '/membership';
    setDestinationUrl(returnTo);

    async function initialVerify() {
      if (hasTriggeredInitialVerify.current || !orderId) return;
      hasTriggeredInitialVerify.current = true;

      if (gatewayStatus === 'failure' || gatewayStatus === 'PAYMENT_ERROR') {
        setErrorMsg('Payment was cancelled or declined at the UPI gateway.');
        return;
      }

      try {
        await verifyPaymentMutate({
          gateway_order_id: orderId,
          gateway_payment_id: paymentId,
          gateway_signature: '',
        });
      } catch (err: unknown) {
        // If initial verify raises error, authoritative status polling will still resolve
        const detail =
          (err as { response?: { data?: { detail?: string; error?: { message?: string } } } }).response?.data
            ?.detail ||
          (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error?.message;
        if (detail && !detail.includes('PAYMENT_PENDING')) {
          setErrorMsg(detail);
        }
      }
    }

    initialVerify();
  }, [orderId, paymentId, gatewayStatus, verifyPaymentMutate, searchParams]);

  // When order status resolves to success
  useEffect(() => {
    if (orderData?.status === 'success') {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['subscriptions'] }),
        queryClient.invalidateQueries({ queryKey: ['creator'] }),
        queryClient.invalidateQueries({ queryKey: ['feed'] }),
        queryClient.invalidateQueries({ queryKey: ['content'] }),
      ]);

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('post_payment_redirect');
      }

      toast.success('Payment verified! Subscription active.');

      const timer = setTimeout(() => {
        router.push(destinationUrl);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [orderData?.status, destinationUrl, router]);

  const currentStatus = orderData?.status || (gatewayStatus === 'PAYMENT_ERROR' || gatewayStatus === 'failure' ? 'failed' : 'pending');

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Payment Confirmation</CardTitle>
          <CardDescription>
            {orderId ? `Order ID: ${orderId}` : 'Verifying transaction'}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          {(orderLoading || currentStatus === 'pending') && (
            <div className="text-center space-y-4">
              <Loader2 className="size-12 animate-spin text-primary mx-auto" />
              <p className="font-medium text-foreground">Waiting for UPI Payment Confirmation</p>
              <p className="text-xs text-muted-foreground">
                We are checking with your UPI bank app (PhonePe / GPay / Paytm). Please do not close this window...
              </p>
            </div>
          )}

          {currentStatus === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="size-16 text-emerald-500 mx-auto" />
              <p className="text-lg font-bold">Payment Successful!</p>
              <p className="text-muted-foreground">
                Your transaction has been verified. Redirecting you to your creator...
              </p>
              <Button onClick={() => router.push(destinationUrl)} className="mt-4 w-full">
                Continue Now
              </Button>
            </div>
          )}

          {currentStatus === 'failed' && (
            <div className="text-center space-y-4">
              <XCircle className="size-16 text-destructive mx-auto" />
              <p className="text-lg font-bold">Payment Unsuccessful</p>
              <p className="text-destructive text-sm">
                {errorMsg || 'The payment could not be completed or was cancelled.'}
              </p>
              <Button onClick={() => router.push(destinationUrl)} variant="outline" className="mt-4 w-full">
                Return to Creator
              </Button>
            </div>
          )}

          {currentStatus === 'expired' && (
            <div className="text-center space-y-4">
              <Clock className="size-16 text-amber-500 mx-auto" />
              <p className="text-lg font-bold">Payment Window Expired</p>
              <p className="text-muted-foreground text-sm">
                The payment session has expired. Please initiate a new subscription checkout.
              </p>
              <Button onClick={() => router.push(destinationUrl)} variant="outline" className="mt-4 w-full">
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentConfirmationContent />
    </Suspense>
  );
}
