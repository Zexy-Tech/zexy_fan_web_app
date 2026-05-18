'use client';

import React, { useState } from 'react';
import { paymentService, CreateIntentResponse, CheckoutSimOutcome } from '@/services/payment';
import { MockCheckoutOverlay } from '@/components/payments/MockCheckoutOverlay';
import { toast } from 'react-hot-toast';

export default function PaymentTestPage() {
  const [loading, setLoading] = useState(false);
  const [activeIntent, setActiveIntent] = useState<CreateIntentResponse | null>(null);
  const [lastTxId, setLastTxId] = useState<number | null>(null);

  const startTestPayment = async () => {
    setLoading(true);
    try {
      // 1. Create Intent (Reference ID 1 for testing)
      const intent = await paymentService.createIntent({
        purpose: 'subscription',
        reference_id: 1,
        currency: 'INR',
      });
      
      console.log('Intent Created:', intent);
      setActiveIntent(intent);
    } catch (err: unknown) {
      toast.error('Failed to create intent');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimOutcome = async (outcome: CheckoutSimOutcome) => {
    if (!activeIntent) return;

    if (outcome === 'cancel') {
      setActiveIntent(null);
      toast('Payment Cancelled', { icon: 'ℹ️' });
      return;
    }

    setLoading(true);
    try {
      // For both success and failure, we call startCheckout to simulate the gateway behavior
      const { outcome: actualOutcome, verifyPayload, errorMessage } = await paymentService.startCheckout({
        intent: activeIntent,
        simulate: outcome
      });

      if (actualOutcome === 'failure') {
        toast.error(errorMessage || 'Payment Failed');
      } else if (actualOutcome === 'success' && verifyPayload) {
        const result = await paymentService.verifyPayment(verifyPayload);
        if (result.success) {
          setLastTxId(result.transaction_id);
          toast.success('Payment Verified Successfully!');
        } else {
          toast.error('Verification failed on backend');
        }
      }
    } catch (err: unknown) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setActiveIntent(null);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">PAYMENT POC</h1>
          <p className="text-zinc-500 uppercase text-xs tracking-widest">End-to-End Simulation Test</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-xl space-y-6">
          <button
            onClick={startTestPayment}
            disabled={loading || !!activeIntent}
            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Test Buy Subscription (₹99)'}
          </button>

          {lastTxId && (
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-emerald-500 font-bold mb-1">Last Successful Transaction</p>
              <code className="bg-black px-3 py-1 rounded text-zinc-400 text-sm">TX_ID: {lastTxId}</code>
            </div>
          )}
        </div>

        <p className="text-zinc-600 text-[10px] leading-relaxed max-w-[280px] mx-auto">
          This page tests the <span className="text-zinc-400">createIntent</span> &rarr; 
          <span className="text-zinc-400">simulation</span> &rarr; 
          <span className="text-zinc-400">verify</span> flow.
        </p>
      </div>

      {activeIntent && (
        <MockCheckoutOverlay
          intent={activeIntent}
          isOpen={!!activeIntent}
          onOutcome={handleSimOutcome}
        />
      )}
    </div>
  );
}
