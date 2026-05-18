'use client';

import { useState, useRef } from 'react';
import { useSetupPIN } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, ChevronRight, KeyRound, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
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
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to update PIN');
    }
  };

  if (isChangingPIN) {
    return (
      <div className="space-y-6 px-4 py-6">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setIsChangingPIN(false); setStep('new'); }}
            className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">{step === 'new' ? 'Set New PIN' : 'Confirm New PIN'}</h1>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
          <CardContent className="pt-8 pb-10 flex flex-col items-center">
            <div className="flex justify-between gap-3 w-full max-w-[280px]">
              {(step === 'new' ? newPIN : confirmPIN).map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="password"
                  inputMode="numeric"
                  value={digit}
                  onChange={(e) => handleDigitChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className={cn(
                    "w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-2xl font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                    digit && "border-purple-500 bg-zinc-800/80"
                  )}
                  disabled={setupPIN.isPending}
                  maxLength={1}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <p className="mt-8 text-sm text-zinc-500 text-center max-w-[240px]">
              {step === 'new' 
                ? 'Enter a 4-digit PIN for your account.' 
                : 'Re-enter your new PIN to confirm.'}
            </p>

            <Button 
              onClick={step === 'new' ? () => newPIN.join('').length === 4 && setStep('confirm') : handleFinish}
              className="mt-8 w-full max-w-[280px] h-12 bg-purple-600 hover:bg-purple-700 font-bold rounded-xl"
              disabled={setupPIN.isPending || (step === 'new' ? newPIN.join('').length < 4 : confirmPIN.join('').length < 4)}
            >
              {setupPIN.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : step === 'new' ? 'Continue' : 'Update PIN'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="space-y-4">
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Security</h2>
          <div className="space-y-2">
            <button 
              onClick={() => setIsChangingPIN(true)}
              className="w-full flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <KeyRound className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Change login PIN</p>
                  <p className="text-xs text-zinc-500">Update your 4-digit security PIN</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </button>
          </div>
        </section>

        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Support</h2>
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Privacy Policy</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-600" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

