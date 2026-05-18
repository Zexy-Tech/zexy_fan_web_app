'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSendOTP, useVerifyOTP } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignupModal({ open, onClose }: SignupModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setMobile('');
      setOtp(['', '', '', '']);
    }
  }, [open]);

  useEffect(() => {
    if (!open || step !== 'otp') return;

    // Ensure first empty OTP box is focused when OTP step opens
    const firstEmptyIndex = otp.findIndex((digit) => digit === '');
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;

    const timer = window.setTimeout(() => {
      otpInputRefs.current[targetIndex]?.focus();
      otpInputRefs.current[targetIndex]?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, step, otp]);

  if (!open) return null;

  const validateMobile = (phone: string) => /^[6-9]\d{9}$/.test(phone);

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!validateMobile(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    try {
      await sendOTP.mutateAsync({ mobile, role: 'fan' });
      toast.success('OTP sent successfully');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to send OTP');
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
      await verifyOTP.mutateAsync({ mobile, otp: otpCode, role: 'fan' });
      toast.success('Login successful!');
      onClose();
      router.push('/feed');
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Invalid OTP');
      setOtp(['', '', '', '']);
      otpInputRefs.current[0]?.focus();
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

    if (newOtp.every((d) => d !== '') && digit) {
      setTimeout(() => {
        if (newOtp.join('').length === 4) {
          handleVerifyOTP();
        }
      }, 250);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xl supports-[backdrop-filter]:bg-black/35"
      onClick={onClose}
    >
      <div className="w-full max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <Card className="border-zinc-800 bg-zinc-900/95 text-white backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold tracking-tight">
                {step === 'phone' ? 'Welcome to Zexy' : 'Verify OTP'}
              </h3>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close signup modal">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <p className="mb-5 text-sm text-zinc-400">
              {step === 'phone'
                ? 'Enter your mobile number to get started'
                : `Enter the 4-digit code sent to +91 ${mobile}`}
            </p>

            {step === 'phone' ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 px-4 font-medium text-zinc-400">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={sendOTP.isPending}
                      className="h-12 flex-1 border-zinc-700 bg-zinc-800 text-lg tracking-wider focus:border-purple-500"
                      autoFocus
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-700"
                  disabled={sendOTP.isPending || mobile.length < 10}
                >
                  {sendOTP.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    'Get Verification Code'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Security Code</label>
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-xs font-medium text-purple-400 hover:underline"
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
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={cn(
                          'h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800 text-center text-2xl font-bold outline-none transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
                          digit && 'border-purple-500 bg-zinc-800/80'
                        )}
                        disabled={verifyOTP.isPending}
                        maxLength={1}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-700"
                  disabled={verifyOTP.isPending || otp.join('').length < 4}
                >
                  {verifyOTP.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
