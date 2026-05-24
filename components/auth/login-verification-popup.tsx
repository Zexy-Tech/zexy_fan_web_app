'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSendOTP, useVerifyOTPOnly } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { isValidIndianMobileTen, normalizeToIndianMobileTen } from '@/lib/indianMobile';

export interface LoginVerificationPopupProps {
  open: boolean;
  onClose: () => void;
  /** Runs after OTP is accepted by the verify API. Close the popup after this resolves. */
  onVerified: (args: { mobile: string; otp: string }) => void | Promise<void>;
  title?: string;
  description?: string;
  /** If valid 10-digit Indian mobile, shown read-only on the first step. */
  prefilledMobile?: string | null;
}

function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const r = (error as { response?: { data?: { error?: { message?: string }; message?: string } } }).response?.data;
    const m = r?.error?.message ?? r?.message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function LoginVerificationPopup({
  open,
  onClose,
  onVerified,
  title = 'Verify your identity',
  description,
  prefilledMobile,
}: LoginVerificationPopupProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOTP = useSendOTP();
  const verifyOnly = useVerifyOTPOnly();

  const lockedTen = normalizeToIndianMobileTen(prefilledMobile ?? undefined);
  const isMobileLocked = lockedTen != null && isValidIndianMobileTen(lockedTen);

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setMobile('');
      setOtp(['', '', '', '']);
      return;
    }
    if (isMobileLocked && lockedTen) {
      setMobile(lockedTen);
    } else {
      setMobile('');
    }
  }, [open, isMobileLocked, lockedTen]);

  useEffect(() => {
    if (!open || step !== 'otp') return;

    const firstEmptyIndex = otp.findIndex((digit) => digit === '');
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;

    const timer = window.setTimeout(() => {
      otpInputRefs.current[targetIndex]?.focus();
      otpInputRefs.current[targetIndex]?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, step, otp]);

  if (!open) return null;

  const defaultDescription =
    step === 'phone'
      ? isMobileLocked
        ? 'We will send a verification code to the mobile number on your account.'
        : 'Enter your mobile number to receive a verification code.'
      : `Enter the 4-digit code sent to +91 ${mobile}`;

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!isValidIndianMobileTen(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6–9');
      return;
    }

    try {
      await sendOTP.mutateAsync({ mobile, role: 'fan' });
      toast.success('OTP sent successfully');
      setStep('otp');
    } catch (error: unknown) {
      toast.error(getAxiosErrorMessage(error, 'Failed to send OTP'));
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 4) {
      toast.error('Please enter a valid 4-digit OTP');
      return;
    }

    if (!isValidIndianMobileTen(mobile)) {
      toast.error('Invalid mobile for verification.');
      return;
    }

    try {
      await verifyOnly.mutateAsync({ mobile, otp: otpCode, role: 'fan' });
    } catch (error: unknown) {
      toast.error(getAxiosErrorMessage(error, 'Invalid OTP'));
      setOtp(['', '', '', '']);
      otpInputRefs.current[0]?.focus();
      return;
    }

    try {
      await onVerified({ mobile, otp: otpCode });
      onClose();
    } catch (error: unknown) {
      toast.error(getAxiosErrorMessage(error, 'Something went wrong. Please try again.'));
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
      window.setTimeout(() => {
        if (newOtp.join('').length === 4) {
          void handleVerifyOTP();
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
              <h3 className="text-lg font-bold tracking-tight">{step === 'phone' ? title : 'Verify OTP'}</h3>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            <p className="mb-5 text-sm text-zinc-400">{description ?? defaultDescription}</p>

            {step === 'phone' ? (
              <form onSubmit={(e) => void handleSendOTP(e)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Mobile number
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 px-4 font-medium text-zinc-400">
                      +91
                    </div>
                    {isMobileLocked ? (
                      <div className="flex h-12 flex-1 items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 text-lg tracking-wider text-zinc-200">
                        {mobile}
                      </div>
                    ) : (
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        disabled={sendOTP.isPending}
                        className="h-12 flex-1 border-zinc-700 bg-zinc-800 text-lg tracking-wider focus:border-purple-500"
                        autoFocus
                      />
                    )}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all hover:bg-purple-700 active:scale-[0.98]"
                  disabled={sendOTP.isPending || mobile.length < 10}
                >
                  {sendOTP.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    'Send verification code'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={(e) => void handleVerifyOTP(e)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Security code
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (isMobileLocked) void handleSendOTP();
                        else setStep('phone');
                      }}
                      className="text-xs font-medium text-purple-400 hover:underline"
                    >
                      {isMobileLocked ? 'Resend code' : 'Change number'}
                    </button>
                  </div>
                  <div className="flex justify-between gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={cn(
                          'h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800 text-center text-lg font-bold outline-none transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
                          digit && 'border-purple-500 bg-zinc-800/80'
                        )}
                        disabled={verifyOnly.isPending}
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all hover:bg-purple-700 active:scale-[0.98]"
                  disabled={verifyOnly.isPending || otp.join('').length < 4}
                >
                  {verifyOnly.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
                <p className="text-center text-xs text-zinc-500">
                  Didn&apos;t receive a code?{' '}
                  <button
                    type="button"
                    className="font-medium text-purple-400 hover:underline"
                    onClick={() => void handleSendOTP()}
                  >
                    Resend
                  </button>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
