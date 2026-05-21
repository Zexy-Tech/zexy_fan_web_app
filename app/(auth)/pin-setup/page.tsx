'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSetupPIN } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';

function PinSetupPageContent() {
  const router = useRouter();
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const setupPIN = useSetupPIN();

  const handlePinChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const target = step === 'create' ? pin : confirmPin;
    const setter = step === 'create' ? setPin : setConfirmPin;
    
    const newPin = [...target];
    newPin[index] = digit;
    setter(newPin);

    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(d => d !== '') && digit) {
      if (step === 'create') {
        setTimeout(() => {
            setStep('confirm');
            inputRefs.current[0]?.focus();
        }, 300);
      } else {
        handleFinish();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && (step === 'create' ? !pin[index] : !confirmPin[index]) && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFinish = async () => {
    const pinCode = pin.join('');
    const confirmCode = confirmPin.join('');

    if (pinCode !== confirmCode) {
      toast.error('PINs do not match. Try again.');
      setConfirmPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
      return;
    }

    try {
      await setupPIN.mutateAsync({ pin: pinCode });
      toast.success('PIN setup successful!');
      router.push('/feed');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosError.response?.data?.error?.message || 'Failed to setup PIN');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            {step === 'create' ? 'Secure Your Account' : 'Confirm PIN'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'create' 
              ? 'Set a 4-digit PIN for faster logins without waiting for OTP.' 
              : 'Please re-enter your 4-digit PIN to confirm.'}
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
          <CardContent className="pt-6 pb-8">
            <div className="space-y-8">
              <div className="flex justify-between gap-3">
                {(step === 'create' ? pin : confirmPin).map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="password"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handlePinChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={cn(
                      "w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-lg font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                      digit && "border-purple-500 bg-zinc-800/80"
                    )}
                    disabled={setupPIN.isPending}
                    maxLength={1}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={step === 'create' ? () => pin.join('').length === 4 && setStep('confirm') : handleFinish}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all" 
                  disabled={setupPIN.isPending || (step === 'create' ? pin.join('').length < 4 : confirmPin.join('').length < 4)}
                >
                  {setupPIN.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    step === 'create' ? 'Continue' : 'Finish Setup'
                  )}
                </Button>
                
                {step === 'confirm' && (
                  <button 
                    type="button" 
                    className="w-full text-center text-sm text-zinc-500 hover:text-purple-400" 
                    onClick={() => { setStep('create'); setConfirmPin(['','','','']); }}
                  >
                    Change PIN
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PinSetupPage() {
  return (
    <Suspense fallback={null}>
      <PinSetupPageContent />
    </Suspense>
  );
}
