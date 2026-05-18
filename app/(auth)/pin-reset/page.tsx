'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useInitiatePINReset, useConfirmPINReset } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, KeyRound, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';

function PinResetPageContent() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp' | 'new_pin' | 'confirm'>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const initiateReset = useInitiatePINReset();
  const confirmReset = useConfirmPINReset();

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      await initiateReset.mutateAsync({ mobile });
      toast.success('Reset code sent successfully');
      setStep('otp');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosError.response?.data?.error?.message || 'Failed to initiate PIN reset');
    }
  };

  const handleFinish = async () => {
    const otpCode = otp.join('');
    const pinCode = newPin.join('');
    const confirmCode = confirmPin.join('');

    if (pinCode !== confirmCode) {
      toast.error('PINs do not match');
      setConfirmPin(['', '', '', '']);
      confirmInputRefs.current[0]?.focus();
      return;
    }

    try {
      await confirmReset.mutateAsync({
        mobile,
        otp: otpCode,
        new_pin: pinCode
      });
      toast.success('PIN reset successful! You can now login with your new PIN.');
      router.push('/login');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosError.response?.data?.error?.message || 'Failed to reset PIN');
    }
  };

  const handleDigitChange = (
    value: string, 
    index: number, 
    digits: string[], 
    setDigits: (d: string[]) => void, 
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    onComplete?: () => void
  ) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    }

    if (newDigits.every(d => d !== '') && digit && onComplete) {
      setTimeout(onComplete, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, digits: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <KeyRound className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {step === 'phone' ? 'Reset PIN' : step === 'otp' ? 'Verify Reset Code' : step === 'new_pin' ? 'New PIN' : 'Confirm New PIN'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'phone' 
              ? 'Enter your mobile number to reset your PIN.' 
              : step === 'otp'
                ? `Enter the 4-digit code sent to +91 ${mobile}`
                : step === 'new_pin'
                  ? 'Set a new 4-digit PIN for your account.'
                  : 'Re-enter your new PIN to confirm.'}
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
          <CardContent className="pt-6">
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                    Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center px-4 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 font-medium">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="flex-1 bg-zinc-800 border-zinc-700 focus:border-purple-500 h-12 text-lg tracking-wider"
                      autoFocus
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all" 
                  disabled={initiateReset.isPending || mobile.length < 10}
                >
                  {initiateReset.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Code'}
                </Button>
                <button 
                  type="button" 
                  onClick={() => router.back()}
                  className="w-full flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="flex justify-between gap-3">
                  {step === 'otp' ? otp.map((digit, index) => (
                    <input
                      key={`otp-${index}`}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleDigitChange(e.target.value, index, otp, setOtp, otpInputRefs, () => setStep('new_pin'))}
                      onKeyDown={(e) => handleKeyDown(e, index, otp, otpInputRefs)}
                      className={cn(
                        "w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-2xl font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                        digit && "border-purple-500 bg-zinc-800/80"
                      )}
                      maxLength={1}
                      autoFocus={index === 0}
                    />
                  )) : step === 'new_pin' ? newPin.map((digit, index) => (
                    <input
                      key={`pin-${index}`}
                      ref={(el) => { pinInputRefs.current[index] = el; }}
                      type="password"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleDigitChange(e.target.value, index, newPin, setNewPin, pinInputRefs, () => setStep('confirm'))}
                      onKeyDown={(e) => handleKeyDown(e, index, newPin, pinInputRefs)}
                      className={cn(
                        "w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-2xl font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                        digit && "border-purple-500 bg-zinc-800/80"
                      )}
                      maxLength={1}
                      autoFocus={index === 0}
                    />
                  )) : confirmPin.map((digit, index) => (
                    <input
                      key={`confirm-${index}`}
                      ref={(el) => { confirmInputRefs.current[index] = el; }}
                      type="password"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleDigitChange(e.target.value, index, confirmPin, setConfirmPin, confirmInputRefs, handleFinish)}
                      onKeyDown={(e) => handleKeyDown(e, index, confirmPin, confirmInputRefs)}
                      className={cn(
                        "w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-2xl font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                        digit && "border-purple-500 bg-zinc-800/80"
                      )}
                      maxLength={1}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={
                      step === 'otp' ? () => otp.join('').length === 4 && setStep('new_pin') :
                      step === 'new_pin' ? () => newPin.join('').length === 4 && setStep('confirm') :
                      handleFinish
                    }
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all" 
                    disabled={
                      confirmReset.isPending || 
                      (step === 'otp' && otp.join('').length < 4) ||
                      (step === 'new_pin' && newPin.join('').length < 4) ||
                      (step === 'confirm' && confirmPin.join('').length < 4)
                    }
                  >
                    {confirmReset.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
                  </Button>
                  
                  <button 
                    type="button" 
                    className="w-full text-center text-sm text-zinc-500 hover:text-purple-400" 
                    onClick={() => {
                      if (step === 'confirm') setStep('new_pin');
                      else if (step === 'new_pin') setStep('otp');
                      else setStep('phone');
                    }}
                  >
                    Go Back
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PinResetPage() {
  return (
    <Suspense fallback={null}>
      <PinResetPageContent />
    </Suspense>
  );
}
