import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useVerifyPayment } from '@/hooks/usePayment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function PaymentConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verifyPayment = useVerifyPayment();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  const orderId = searchParams.get('order_id');
  const paymentId = searchParams.get('payment_id');
  const gatewayStatus = searchParams.get('status');

  useEffect(() => {
    async function verify() {
      if (!orderId || !paymentId) {
        setStatus('error');
        setErrorMsg('Missing payment information.');
        return;
      }

      if (gatewayStatus === 'failure') {
        setStatus('error');
        setErrorMsg('Payment was cancelled or failed at the gateway.');
        return;
      }

      try {
        await verifyPayment.mutateAsync({
          gateway_order_id: orderId,
          gateway_payment_id: paymentId,
          gateway_signature: 'sig_mock_' + Date.now(), // Mock signature for now
        });
        setStatus('success');
        toast.success('Payment verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.response?.data?.detail || 'Failed to verify payment with our servers.');
      }
    }

    verify();
  }, [orderId, paymentId, gatewayStatus, verifyPayment]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Payment Confirmation</CardTitle>
          <CardDescription>
            Order ID: {orderId}
          </CardDescription>
        </CardHeader>
        <CardContent className="py-8">
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <Loader2 className="size-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Verifying your payment, please wait...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="size-16 text-emerald-500 mx-auto" />
              <p className="text-lg font-bold">Payment Successful!</p>
              <p className="text-muted-foreground">Your transaction has been verified. You can now access the content.</p>
              <Button onClick={() => router.push('/creators')} className="mt-4 w-full">
                Continue Browsing
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <XCircle className="size-16 text-destructive mx-auto" />
              <p className="text-lg font-bold">Payment Failed</p>
              <p className="text-destructive">{errorMsg}</p>
              <Button onClick={() => router.back()} variant="outline" className="mt-4 w-full">
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
