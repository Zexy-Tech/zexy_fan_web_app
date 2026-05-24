'use client';

import { Rocket, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const PRESETS = [49, 99, 149, 199] as const;

interface TipModalProps {
  open: boolean;
  amount: number;
  onAmountChange: (amount: number) => void;
  onClose: () => void;
  onSend?: (amount: number) => void;
  lockAmount?: boolean;
  title?: string;
}

export function TipModal({
  open,
  amount,
  onAmountChange,
  onClose,
  onSend,
  lockAmount = false,
  title = 'Tip amount',
}: TipModalProps) {
  if (!open) return null;

  const handleBackdropClick = () => {
    onClose();
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
      onClick={handleBackdropClick}
    >
      <Card
        className="w-full max-w-md rounded-2xl border-zinc-700 bg-zinc-900 text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="relative pb-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            className="absolute right-2 top-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-5 pb-6">
          <div className="text-center">
            <div className="text-sm text-zinc-400">{title}</div>
            {lockAmount ? (
              <div className="mt-2 text-lg font-bold tabular-nums">₹{amount}</div>
            ) : (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-lg font-bold">₹</span>
                <Input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  className="h-11 max-w-[160px] border-zinc-600 bg-black text-center text-lg font-bold tabular-nums text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  value={amount < 1 ? '' : amount}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      onAmountChange(0);
                      return;
                    }
                    const v = parseInt(raw, 10);
                    if (!Number.isNaN(v) && v >= 0) onAmountChange(v);
                  }}
                />
              </div>
            )}
          </div>

          {!lockAmount && (
            <div className="flex w-full flex-nowrap gap-2">
              {PRESETS.map((preset) => {
                const active = preset === amount;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onAmountChange(preset)}
                    className={[
                      'min-w-0 flex-1 rounded-xl border px-2 py-3 text-center text-sm font-semibold transition-colors sm:px-3 sm:text-sm',
                      active
                        ? 'border-pink-500 bg-pink-500/20 text-white'
                        : 'border-zinc-600 bg-zinc-800 text-zinc-200 hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    ₹{preset}
                  </button>
                );
              })}
            </div>
          )}

          <Button
            type="button"
            className="w-full gap-2 rounded-xl font-semibold bg-pink-600 hover:bg-pink-500"
            onClick={() => (onSend ? onSend(amount) : onClose())}
            disabled={!lockAmount && (!amount || amount < 1)}
          >
            <Rocket className="size-4 shrink-0" aria-hidden />
            Send Tip
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

