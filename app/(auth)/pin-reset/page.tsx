'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInitiatePINReset, useConfirmPINReset } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Instagram, Twitter, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';
import Image from 'next/image';

function PinResetPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMobile = searchParams.get('mobile') || '';

  const [step, setStep] = useState<'phone' | 'otp' | 'new_pin' | 'confirm'>(initialMobile ? 'otp' : 'phone');
  const [mobile, setMobile] = useState(initialMobile);
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

  const handleFinish = async (manualConfirmCode?: string) => {
    const otpCode = otp.join('');
    const pinCode = newPin.join('');
    const confirmCode = manualConfirmCode || confirmPin.join('');

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
    onComplete?: (finalCode: string) => void
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
      const final = newDigits.join('');
      if (final.length === 4) {
        setTimeout(() => onComplete(final), 100);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, digits: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4 font-inter">
      <div className="w-full max-w-[400px] space-y-10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="size-24 flex items-center justify-center mb-2 relative overflow-hidden group">
            <Image 
              src="/zexy_z_letter_logo_nobg.png" 
              alt="Zexy logo" 
              width={80} 
              height={80} 
              priority
              className="object-contain drop-shadow-[0_0_15px_rgba(140,61,241,0.3)] group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-black tracking-[0.1em] uppercase italic bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">ZEXY</h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em] pl-[0.5em]">
              {step === 'phone' ? 'Reset PIN' : step === 'otp' ? 'Verify Code' : 'Secure Account'}
            </p>
          </div>
        </div>

        <Card className="border-zinc-800/50 bg-[#121214]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8c3df1] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <CardContent className="p-8">
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                  <label htmlFor="mobile-input-reset" className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                    Mobile Number
                  </label>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-20 h-14 bg-[#1c1c1f] border border-zinc-800 rounded-xl text-zinc-300 font-semibold">
                      +91
                    </div>
                    <div className="flex-1 relative group">
                      <input
                        id="mobile-input-reset"
                        type="tel"
                        placeholder="9876543210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full h-14 bg-[#1c1c1f] border-2 border-zinc-800 rounded-xl px-4 text-lg font-medium text-white focus:outline-none focus:border-[#8c3df1] focus:ring-2 focus:ring-[#8c3df1]/30 transition-all placeholder:text-zinc-700"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-4 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-[#521c98] hover:bg-[#5f259f] text-white font-bold rounded-xl transition-all active:scale-[0.98] text-base" 
                    disabled={initiateReset.isPending || mobile.length < 10}
                  >
                    {initiateReset.isPending ? <Loader2 className="size-5 animate-spin" /> : 'Send Reset Code'}
                  </Button>
                  <button 
                    type="button" 
                    onClick={() => router.back()}
                    className="w-full flex items-center justify-center gap-2 text-sm text-zinc-500 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="size-4" /> Back to Login
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="flex justify-between gap-3">
                  {step === 'otp' ? otp.map((digit, index) => (
                    <input
                      key={`otp-reset-${index}`}
                      ref={(el) => { otpInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      aria-label={`OTP digit ${index + 1}`}
                      onChange={(e) => handleDigitChange(e.target.value, index, otp, setOtp, otpInputRefs, () => setStep('new_pin'))}
                      onKeyDown={(e) => handleKeyDown(e, index, otp, otpInputRefs)}
                      className={cn(
                        "w-full h-16 bg-[#1c1c1f] border-2 border-zinc-800 rounded-xl text-center text-2xl font-bold focus:border-[#8c3df1] focus:ring-2 focus:ring-[#8c3df1]/30 outline-none transition-all",
                        digit && "border-[#8c3df1] bg-[#1c1c1f]"
                      )}
                      maxLength={1}
                    />
                  )) : step === 'new_pin' ? newPin.map((digit, index) => (
                    <input
                      key={`new-pin-${index}`}
                      ref={(el) => { pinInputRefs.current[index] = el; }}
                      type="password"
                      inputMode="numeric"
                      value={digit}
                      aria-label={`New PIN digit ${index + 1}`}
                      onChange={(e) => handleDigitChange(e.target.value, index, newPin, setNewPin, pinInputRefs, () => setStep('confirm'))}
                      onKeyDown={(e) => handleKeyDown(e, index, newPin, pinInputRefs)}
                      className={cn(
                        "w-full h-16 bg-[#1c1c1f] border-2 border-zinc-800 rounded-xl text-center text-2xl font-bold focus:border-[#8c3df1] focus:ring-2 focus:ring-[#8c3df1]/30 outline-none transition-all",
                        digit && "border-[#8c3df1] bg-[#1c1c1f]"
                      )}
                      maxLength={1}
                    />
                  )) : confirmPin.map((digit, index) => (
                    <input
                      key={`confirm-pin-${index}`}
                      ref={(el) => { confirmInputRefs.current[index] = el; }}
                      type="password"
                      inputMode="numeric"
                      value={digit}
                      aria-label={`Confirm PIN digit ${index + 1}`}
                      onChange={(e) => handleDigitChange(e.target.value, index, confirmPin, setConfirmPin, confirmInputRefs, (code) => handleFinish(code))}
                      onKeyDown={(e) => handleKeyDown(e, index, confirmPin, confirmInputRefs)}
                      className={cn(
                        "w-full h-16 bg-[#1c1c1f] border-2 border-zinc-800 rounded-xl text-center text-2xl font-bold focus:border-[#8c3df1] focus:ring-2 focus:ring-[#8c3df1]/30 outline-none transition-all",
                        digit && "border-[#8c3df1] bg-[#1c1c1f]"
                      )}
                      maxLength={1}
                    />
                  ))}
                </div>

                <div className="space-y-4 pt-2">
                  <Button 
                    onClick={
                      step === 'otp' ? () => otp.join('').length === 4 && setStep('new_pin') :
                      step === 'new_pin' ? () => newPin.join('').length === 4 && setStep('confirm') :
                      () => handleFinish()
                    }
                    className="w-full h-14 bg-[#521c98] hover:bg-[#5f259f] text-white font-bold rounded-xl transition-all active:scale-[0.98] text-base" 
                    disabled={
                      confirmReset.isPending || 
                      (step === 'otp' && otp.join('').length < 4) ||
                      (step === 'new_pin' && newPin.join('').length < 4) ||
                      (step === 'confirm' && confirmPin.join('').length < 4)
                    }
                  >
                    {confirmReset.isPending ? <Loader2 className="size-5 animate-spin" /> : 'Continue'}
                  </Button>
                  
                  <button 
                    type="button" 
                    className="w-full text-center text-sm text-zinc-500 hover:text-purple-400 transition-colors" 
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

        {/* Social Media Links */}
        <div className="flex flex-col items-center gap-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px flex-1 bg-zinc-800/50" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Connect with us</span>
            <div className="h-px flex-1 bg-zinc-800/50" />
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="https://instagram.com/zexy.live" 
              target="_blank" 
              rel="noopener noreferrer"
              className="size-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 transition-all hover:bg-[#e789ff]/5 group"
            >
              <Instagram className="size-5 group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href="https://twitter.com/zexylive" 
              target="_blank" 
              rel="noopener noreferrer"
              className="size-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 transition-all hover:bg-[#e789ff]/5 group"
            >
              <Twitter className="size-5 group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href="https://facebook.com/zexylive" 
              target="_blank" 
              rel="noopener noreferrer"
              className="size-12 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 transition-all hover:bg-[#e789ff]/5 group"
            >
              <Facebook className="size-5 group-hover:scale-110 transition-transform" />
            </a>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-zinc-500 uppercase opacity-60">
             <a href="https://zexy.live/privacy-policy" className="hover:text-zinc-300 transition-colors">Privacy</a>
             <div className="size-1 rounded-full bg-zinc-800" />
             <a href="https://zexy.live/terms-of-service" className="hover:text-zinc-300 transition-colors">Terms</a>
             <div className="size-1 rounded-full bg-zinc-800" />
             <span className="cursor-default">© 2026 ZEXY</span>
          </div>
        </div>
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
