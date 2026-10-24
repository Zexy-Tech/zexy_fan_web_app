'use client';

import { useState } from 'react';
import { useCreatePaymentIntent } from '@/hooks/usePayment';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { CreateIntentResponse } from '@/services/payment';
import { DirectUpiCheckoutModal } from '@/components/payments/DirectUpiCheckoutModal';

interface PaymentModalProps {
  contentId: number;
  amount: number;
  title: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PaymentModal({ contentId, amount, title, onClose, onSuccess }: PaymentModalProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [checkoutIntent, setCheckoutIntent] = useState<CreateIntentResponse | null>(null);
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  const createIntent = useCreatePaymentIntent();

  const handlePayment = async () => {
    setStatus('processing');

    try {
      // Step 1: Create payment intent on backend
      const intent = await createIntent.mutateAsync({
        purpose: 'content',
        reference_id: contentId,
      });

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('post_payment_redirect', `/content/${contentId}`);
      }

      // Step 2: Open Direct UPI checkout modal
      setCheckoutIntent(intent);
      setShowCheckoutModal(true);
      setStatus('idle');
    } catch (error: unknown) {
      setStatus('error');
      const errorMessage =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        (error as Error)?.message ||
        'Payment failed';
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
                <span className="text-lg font-bold">{formatCurrency(amount)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                You will get instant access to this content after payment.
              </p>
            </div>
          )}

          {status === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="size-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Processing payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="size-12 text-green-500" />
              <p className="text-sm font-semibold">Payment successful!</p>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <XCircle className="size-12 text-destructive" />
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

      <DirectUpiCheckoutModal
        isOpen={showCheckoutModal}
        intent={checkoutIntent}
        itemName={`Content: ${title}`}
        onClose={() => setShowCheckoutModal(false)}
        onSuccess={() => {
          setShowCheckoutModal(false);
          setStatus('success');
          toast.success('Content unlocked successfully!');
          onSuccess?.();
          onClose();
        }}
      />
    </div>
  );
}
