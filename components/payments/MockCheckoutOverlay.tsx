'use client';

import React from 'react';
import { CreateIntentResponse, CheckoutSimOutcome } from '@/services/payment';

interface MockCheckoutOverlayProps {
  intent: CreateIntentResponse;
  onOutcome: (outcome: CheckoutSimOutcome) => void;
  isOpen: boolean;
}

export const MockCheckoutOverlay: React.FC<MockCheckoutOverlayProps> = ({
  intent,
  onOutcome,
  isOpen,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-zinc-800/50 px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="size-2 bg-yellow-500 rounded-full" />
            Payment Simulation
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            Gateway: <span className="text-zinc-200 font-mono uppercase">{intent.payment_gateway || 'mock'}</span>
          </p>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-baseline">
            <span className="text-zinc-400">Amount to Pay</span>
            <span className="text-lg font-black text-white">
              {intent.currency} {intent.amount.toFixed(2)}
            </span>
          </div>

          <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800/50 space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-500">Order ID</span>
              <span className="text-zinc-300">{intent.gateway_order_id}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-zinc-500">Intent ID</span>
              <span className="text-zinc-300">#{intent.intent_id}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => onOutcome('success')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20"
            >
              Simulate Success
            </button>
            <button
              onClick={() => onOutcome('failure')}
              className="w-full bg-zinc-800 hover:bg-red-900/40 hover:text-red-400 text-zinc-300 font-bold py-4 rounded-xl border border-zinc-700 hover:border-red-900/50"
            >
              Simulate Failure
            </button>
            <button
              onClick={() => onOutcome('cancel')}
              className="w-full bg-transparent hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 font-medium py-3 rounded-xl"
            >
              Cancel Payment
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-zinc-950/30 px-6 py-3 border-t border-zinc-800/50">
          <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest">
            Spec-Driven Development Mode • No Real Charges
          </p>
        </div>
      </div>
    </div>
  );
};
