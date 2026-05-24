'use client';

import { useState, useRef } from 'react';
import { useSetupPIN } from '@/hooks/useAuth';
import { useTypography } from '@/hooks/useTypography';
import { useSecurity } from '@/hooks/useSecurity';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, ChevronRight, KeyRound, ArrowLeft, Type, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { fontSize, setFontSize } = useTypography();
  const { watermarkEnabled, setWatermarkEnabled } = useSecurity();
  const [isChangingPIN, setIsChangingPIN] = useState(false);
  const [step, setStep] = useState<'new' | 'confirm'>('new');
  const [newPIN, setNewPIN] = useState(['', '', '', '']);
  const [confirmPIN, setConfirmPIN] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setupPIN = useSetupPIN();

  const handleDigitChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const target = step === 'new' ? newPIN : confirmPIN;
    const setter = step === 'new' ? setNewPIN : setConfirmPIN;
    
    const newDigits = [...target];
    newDigits[index] = digit;
    setter(newDigits);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newDigits.every(d => d !== '') && digit) {
      if (step === 'new') {
        setTimeout(() => {
          setStep('confirm');
          inputRefs.current[0]?.focus();
        }, 300);
      } else {
        void handleFinish();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const target = step === 'new' ? newPIN : confirmPIN;
    if (e.key === 'Backspace' && !target[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFinish = async () => {
    const pinCode = newPIN.join('');
    const confirmCode = confirmPIN.join('');

    if (pinCode !== confirmCode) {
      toast.error('PINs do not match');
      setConfirmPIN(['', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }

    try {
      await setupPIN.mutateAsync({ pin: pinCode });
      toast.success('PIN updated successfully!');
      setIsChangingPIN(false);
      setNewPIN(['', '', '', '']);
      setConfirmPIN(['', '', '', '']);
      setStep('new');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to update PIN';
      toast.error(errorMessage);
    }
  };

  if (isChangingPIN) {
    return (
      <div className="space-y-6 px-4 py-6 bg-zinc-950 min-h-screen text-white">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => { setIsChangingPIN(false); setStep('new'); }}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
            aria-label="Back to settings"
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-lg font-semibold">{step === 'new' ? 'Set New PIN' : 'Confirm New PIN'}</h1>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
          <CardContent className="pt-8 pb-10 flex flex-col items-center">
            <div className="flex justify-between gap-3 w-full max-w-[280px]">
              {(step === 'new' ? newPIN : confirmPIN).map((digit, index) => (
                <input
                  key={`pin-input-${index}`}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="password"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleDigitChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  aria-label={`Digit ${index + 1}`}
                  className={cn(
                    "w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-lg font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                    digit && "border-purple-500 bg-zinc-800/80"
                  )}
                  disabled={setupPIN.isPending}
                  maxLength={1}
                />
              ))}
            </div>

            <p className="mt-8 text-sm text-zinc-500 text-center max-w-[240px]">
              {step === 'new' 
                ? 'Enter a 4-digit PIN for your account.' 
                : 'Re-enter your new PIN to confirm.'}
            </p>

            <Button 
              type="button"
              onClick={step === 'new' ? () => newPIN.join('').length === 4 && setStep('confirm') : handleFinish}
              className="mt-8 w-full max-w-[280px] h-12 bg-purple-600 hover:bg-purple-700 font-bold rounded-xl"
              disabled={setupPIN.isPending || (step === 'new' ? newPIN.join('').length < 4 : confirmPIN.join('').length < 4)}
            >
              {setupPIN.isPending ? <Loader2 className="size-5 animate-spin" /> : step === 'new' ? 'Continue' : 'Update PIN'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 bg-zinc-950 min-h-screen text-white">
      <h1 className="text-lg font-semibold">Settings</h1>

      <div className="space-y-4">
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Display</h2>
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Type className="size-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Font Size</p>
                  <p className="text-xs text-zinc-500">Adjust the app text size</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {(['compact', 'standard', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFontSize(size)}
                    className={cn(
                      "py-2 px-3 rounded-lg text-xs font-semibold capitalize transition-all border",
                      fontSize === size 
                        ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20" 
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Eye className="size-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Content Watermark</p>
                  <p className="text-xs text-zinc-500">Traceable ID on top of media</p>
                </div>
              </div>
              <Switch
                checked={watermarkEnabled}
                onCheckedChange={(checked: boolean) => {
                  setWatermarkEnabled(checked);
                  toast.success(`Watermark ${checked ? 'enabled' : 'disabled'}`);
                }}
                aria-label="Toggle content watermark"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Security</h2>
          <div className="space-y-2">
            <button 
              type="button"
              onClick={() => setIsChangingPIN(true)}
              className="w-full flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors"
              aria-label="Change login PIN"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <KeyRound className="size-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Change login PIN</p>
                  <p className="text-xs text-zinc-500">Update your 4-digit security PIN</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-zinc-600" aria-hidden />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Support</h2>
          <div className="space-y-2">
            <button 
              type="button"
              onClick={async () => {
                toast.info('Simulating API error…');
                try {
                  const res = await fetch('http://localhost:8000/api/v1/debug/force-crash-test-500');
                  const data = await res.json();
                  if (!res.ok) {
                    // Display the new flat error message format directly
                    toast.error(data.message || 'API Error');
                    Sentry.captureException(new Error(data.message || 'API Error'), {
                      tags: { context: 'fan_settings_debug' },
                      extra: { data }
                    });
                  }
                } catch (err) {
                  Sentry.captureException(err, {
                    tags: { context: 'fan_settings_debug' },
                  });
                  toast.error('Network Error: Make sure API is running on port 8000');
                }
              }}
              className="w-full flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors"
              aria-label="Simulate API Error"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Loader2 className="size-5 text-orange-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Simulate API Error</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-zinc-600" aria-hidden />
            </button>

            <button 
              type="button"
              onClick={() => {
                toast.info('Forcing app crash…');
                setTimeout(() => {
                  throw new Error('FAN WEB HARD CRASH: Testing Sentry Session Replay');
                }, 500);
              }}
              className="w-full flex items-center justify-between p-4 bg-red-500/05 border border-red-900/20 rounded-xl hover:bg-red-500/10 transition-colors"
              aria-label="Force App Crash"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <ShieldCheck className="size-5 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-red-500">Force App Crash</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-zinc-600" aria-hidden />
            </button>

            <button 
              type="button"
              className="w-full flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors"
              aria-label="Privacy Policy"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ShieldCheck className="size-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Privacy Policy</p>
                </div>
              </div>
              <ChevronRight className="size-5 text-zinc-600" aria-hidden />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

