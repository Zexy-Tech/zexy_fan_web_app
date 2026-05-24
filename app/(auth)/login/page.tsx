'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSendOTP, useVerifyOTP, useLoginWithPIN } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Instagram, Twitter, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';
import Image from 'next/image';

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  return raw;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pin, setPin] = useState(['', '', '', '']);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();
  const loginWithPIN = useLoginWithPIN();

  const validateMobile = (phone: string) => {
    return /^[6-9]\d{9}$/.test(phone);
  };

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateMobile(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    try {
      const response = await sendOTP.mutateAsync({ mobile, role: 'fan' });
      if (response.auth_method === 'pin') {
        setStep('pin');
        toast.success('Please enter your PIN');
      } else {
        setStep('otp');
        toast.success('OTP sent successfully');
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosError.response?.data?.error?.message || 'Failed to process request');
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    try {
      const response = await verifyOTP.mutateAsync({ mobile, otp: otpCode, role: 'fan' });
      toast.success('Login successful!');
      
      if (response.is_new_user) {
        router.push('/pin-setup');
      } else {
        const next = safeInternalPath(searchParams.get('next'));
        router.push(next ?? '/feed');
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosError.response?.data?.error?.message || 'Invalid OTP');
      setOtp(['', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  };

  const handleVerifyPIN = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pinCode = pin.join('');

    if (pinCode.length !== 4) {
      toast.error('Please enter your 4-digit PIN');
      return;
    }

    try {
      await loginWithPIN.mutateAsync({ mobile, pin: pinCode, role: 'fan' });
      toast.success('Login successful!');
      const next = safeInternalPath(searchParams.get('next'));
      router.push(next ?? '/feed');
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>;
      toast.error(axiosError.response?.data?.error?.message || 'Invalid PIN');
      setPin(['', '', '', '']);
      pinInputRefs.current[0]?.focus();
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every(d => d !== '') && digit) {
      setTimeout(() => {
        if (newOtp.join('').length === 4) handleVerifyOTP();
      }, 300);
    }
  };

  const handlePinChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    if (digit && index < 3) {
      pinInputRefs.current[index + 1]?.focus();
    }

    if (newPin.every(d => d !== '') && digit) {
      setTimeout(() => {
        if (newPin.join('').length === 4) handleVerifyPIN();
      }, 300);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, isOtp: boolean) => {
    if (e.key === 'Backspace' && (isOtp ? !otp[index] : !pin[index]) && index > 0) {
      (isOtp ? otpInputRefs : pinInputRefs).current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4 font-inter">
      <div className="w-full max-w-[400px] space-y-10">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="size-24 bg-[#8c3df1] rounded-[2rem] flex items-center justify-center mb-2 shadow-[0_0_40px_rgba(140,61,241,0.5)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Image 
              src="/zexy_z_letter_logo_nobg.png" 
              alt="Zexy logo" 
              width={64} 
              height={64} 
              priority
              className="object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] scale-90 group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-[-0.05em] uppercase italic bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">Zexy</h1>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-[0.4em] opacity-80">
              {step === 'phone' ? 'Premium Creator Hub' : step === 'pin' ? 'Security Check' : 'Verification'}
            </p>
          </div>
        </div>

        <Card className="border-zinc-800/50 bg-[#121214]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8c3df1] to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <CardContent className="p-8">
            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                    Mobile Number
                  </label>
                  <div className="flex gap-3">
                    <div className="flex items-center justify-center w-20 h-14 bg-[#1c1c1f] border border-zinc-800 rounded-xl text-zinc-300 font-semibold">
                      +91
                    </div>
                    <div className="flex-1 relative group">
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={sendOTP.isPending}
                        className="w-full h-14 bg-[#1c1c1f] border-2 border-[#8c3df1] rounded-xl px-4 text-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-[#8c3df1]/50 placeholder:text-zinc-700"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-[#521c98] hover:bg-[#5f259f] text-white font-bold rounded-xl transition-all active:scale-[0.98] text-base" 
                    disabled={sendOTP.isPending || !validateMobile(mobile)}
                  >
                    {sendOTP.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </form>
            ) : step === 'pin' ? (
              <form onSubmit={handleVerifyPIN} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                      Your PIN
                    </label>
                    <button 
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-xs text-purple-400 font-medium hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  
                  <div className="flex justify-between gap-4">
                    {pin.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { pinInputRefs.current[index] = el; }}
                        type="password"
                        inputMode="numeric"
                        value={digit}
                        onChange={(e) => handlePinChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index, false)}
                        className={cn(
                          "w-full h-16 bg-[#1c1c1f] border-2 border-zinc-800 rounded-xl text-center text-2xl font-bold focus:border-[#8c3df1] focus:ring-2 focus:ring-[#8c3df1]/30 outline-none transition-all",
                          digit && "border-[#8c3df1] bg-[#1c1c1f]"
                        )}
                        disabled={loginWithPIN.isPending}
                        maxLength={1}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-[#521c98] hover:bg-[#5f259f] text-white font-bold rounded-xl transition-all active:scale-[0.98] text-base" 
                    disabled={loginWithPIN.isPending || pin.join('').length < 4}
                  >
                    {loginWithPIN.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      'Login'
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <button 
                      type="button" 
                      className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
                      onClick={() => router.push(`/pin-reset?mobile=${mobile}`)}
                    >
                      Forgot PIN? <span className="text-purple-400 font-medium underline underline-offset-4">Reset here</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
                      Security Code
                    </label>
                    <button 
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-xs text-purple-400 font-medium hover:underline"
                    >
                      Change Number
                    </button>
                  </div>
                  
                  <div className="flex justify-between gap-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpInputRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index, true)}
                        className={cn(
                          "w-full h-16 bg-[#1c1c1f] border-2 border-zinc-800 rounded-xl text-center text-2xl font-bold focus:border-[#8c3df1] focus:ring-2 focus:ring-[#8c3df1]/30 outline-none transition-all",
                          digit && "border-[#8c3df1] bg-[#1c1c1f]"
                        )}
                        disabled={verifyOTP.isPending}
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <Button 
                    type="submit" 
                    className="w-full h-14 bg-[#521c98] hover:bg-[#5f259f] text-white font-bold rounded-xl transition-all active:scale-[0.98] text-base" 
                    disabled={verifyOTP.isPending || otp.join('').length < 4}
                  >
                    {verifyOTP.isPending ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <button 
                      type="button" 
                      className="text-sm text-zinc-500 hover:text-purple-400 transition-colors"
                      onClick={handleSendOTP}
                    >
                      Didn&apos;t receive code? <span className="text-purple-400 font-medium underline underline-offset-4">Resend</span>
                    </button>
                  </div>
                </div>
              </form>
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader2 className="size-10 animate-spin text-purple-500" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
