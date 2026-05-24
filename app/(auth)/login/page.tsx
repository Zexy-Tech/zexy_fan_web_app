import { Metadata } from "next";

export const metadata: Metadata = { title: "Zexy", description: "Production-grade creator monetization platform" };
'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSendOTP, useVerifyOTP, useLoginWithPIN } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AxiosError } from 'axios';

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  return raw;
}

function LoginPageContent() {
  const { push } = useRouter();
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
        push('/pin-setup');
      } else {
        const next = safeInternalPath(searchParams.get('next'));
        push(next ?? '/feed');
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
      push(next ?? '/feed');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4">
      <div className="w-full max-w-[400px] space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="size-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-purple-500/20">
            <span className="text-lg font-bold italic">Z</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">
            {step === 'phone' ? 'Welcome to Zexy' : step === 'pin' ? 'Login with PIN' : 'Verify OTP'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'phone' 
              ? 'Enter your mobile number to get started' 
              : step === 'pin'
                ? `Enter your 4-digit PIN for +91 ${mobile}`
                : `Enter the 4-digit code sent to +91 ${mobile}`}
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
                      disabled={sendOTP.isPending}
                      className="flex-1 bg-zinc-800 border-zinc-700 focus:border-purple-500 h-12 text-lg tracking-wider"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all active:scale-[0.98]" 
                    disabled={sendOTP.isPending || mobile.length < 10}
                  >
                    Continue
                  </Button>
                </div>
              </form>
            ) : step === 'pin' ? (
              <form onSubmit={handleVerifyPIN} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                      Your PIN
                    </label>
                    <button 
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-xs text-purple-400 font-medium hover:underline flex items-center"
                    >
                      Change Number
                    </button>
                  </div>
                  
                  <div className="flex justify-between gap-3">
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
                          "w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-lg font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                          digit && "border-purple-500 bg-zinc-800/80"
                        )}
                        disabled={loginWithPIN.isPending}
                        maxLength={1}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all active:scale-[0.98]" 
                    disabled={loginWithPIN.isPending || pin.join('').length < 4}
                  >
                    {loginWithPIN.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                        Logging in…
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                  
                  <div className="flex flex-col gap-2 pt-2">
                    <p className="text-center text-sm text-zinc-500">
                      Forgot PIN? <button type="button" className="text-purple-400 font-medium hover:underline" onClick={() => push(`/pin-reset?mobile=${mobile}`)}>Reset your PIN</button>
                    </p>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">
                      Security Code
                    </label>
                    <button 
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-xs text-purple-400 font-medium hover:underline flex items-center"
                    >
                      Change Number
                    </button>
                  </div>
                  
                  <div className="flex justify-between gap-3">
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
                          "w-full h-14 bg-zinc-800 border border-zinc-700 rounded-xl text-center text-lg font-bold focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all",
                          digit && "border-purple-500 bg-zinc-800/80"
                        )}
                        disabled={verifyOTP.isPending}
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all active:scale-[0.98]" 
                    disabled={verifyOTP.isPending || otp.join('').length < 4}
                  >
                    {verifyOTP.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                        Verifying…
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>
                  
                  <p className="text-center text-sm text-zinc-500">
                    Didn&apos;t receive code? <button type="button" className="text-purple-400 font-medium hover:underline" onClick={handleSendOTP}>Resend</button>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
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
