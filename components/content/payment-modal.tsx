'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreatePaymentIntent, useVerifyPayment } from '@/hooks/usePayment';
import { useUnlockContent } from '@/hooks/useContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentModalProps {
  contentId: number;
  amount: number;
  title: string;
  onClose: () => void;
}

export function PaymentModal({ contentId, amount, title, onClose }: PaymentModalProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const createIntent = useCreatePaymentIntent();
  const verifyPayment = useVerifyPayment();
  const unlockContent = useUnlockContent();

  const handlePayment = async () => {
    setStatus('processing');

    try {
      // Step 1: Create payment intent
      const intent = await createIntent.mutateAsync({
        purpose: 'content',
        reference_id: contentId,
      });

      if (intent.mock_checkout_url) {
        // Handle mock:// protocol if returned by backend, or absolute/relative URLs
        let targetUrl = intent.mock_checkout_url;
        if (targetUrl.startsWith('mock://')) {
          const urlParams = targetUrl.replace('mock://checkout?', '');
          targetUrl = `/mock-pg?${urlParams}`;
        }
        window.location.href = targetUrl;
        return; // Component will unmount
      }

      // Step 2: Simulate Razorpay payment (fallback/legacy)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Verify payment
      await verifyPayment.mutateAsync({
        gateway_order_id: intent.gateway_order_id,
        gateway_payment_id: 'pay_mock_' + Date.now(),
        gateway_signature: 'sig_mock_' + Date.now(),
      });

      // Step 4: Unlock content
      await unlockContent.mutateAsync(contentId);

      setStatus('success');
      toast.success('Content unlocked successfully!');

      // Redirect to content page after 1 second
      setTimeout(() => {
      router.push(`/content/${contentId}`);
      onClose();
      }, 1000);
      } catch (error: unknown) {
      setStatus('error');
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Payment failed';
      toast.error(errorMessage);
      }
      };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Unlock Content</CardTitle>
          <CardDescription>{title}</CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-4 border-y">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-2xl font-bold">{formatCurrency(amount)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You will get instant access to this content after payment.
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <p className="text-sm font-semibold">Payment successful!</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm font-semibold text-destructive">Payment failed</p>
              <p className="text-sm text-muted-foreground">Please try again</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-2">
          {status === 'idle' && (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePayment} className="flex-1">
                Pay {formatCurrency(amount)}
              </Button>
            </>
          )}
          {status === 'error' && (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handlePayment} className="flex-1">
                Retry
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
