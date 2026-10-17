'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSendOTP, useVerifyOTPOnly, useVerifyPINOnly } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { isValidIndianMobileTen, normalizeToIndianMobileTen } from '@/lib/indianMobile';

export interface LoginVerificationPopupProps {
  open: boolean;
  onClose: () => void;
  /** Runs after OTP/PIN is accepted by the verify API. Close the popup after this resolves. */
  onVerified: (args: { mobile: string; otp: string; token?: string }) => void | Promise<void>;
  title?: string;
  description?: string;
  /** If valid 10-digit Indian mobile, shown read-only on the first step (unless allowEditMobile is true). */
  prefilledMobile?: string | null;
  allowEditMobile?: boolean;
}

function getAxiosErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const r = (error as { response?: { data?: { error?: { message?: string }; message?: string } } }).response?.data;
    const m = r?.error?.message ?? r?.message;
    if (typeof m === 'string' && m.length > 0) {
      const parts = m.split(' - ');
      if (parts.length >= 3) return parts.slice(2).join(' - ');
      return m;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function LoginVerificationPopup({
  open,
  onClose,
  onVerified,
  title = 'Verify Mobile',
  description,
  prefilledMobile,
  allowEditMobile = true,
}: LoginVerificationPopupProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'pin'>('phone');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const hasTriggeredRef = useRef(false);

  const sendOTP = useSendOTP();
  const verifyOTPOnly = useVerifyOTPOnly();
  const verifyPINOnly = useVerifyPINOnly();

  const lockedTen = normalizeToIndianMobileTen(prefilledMobile ?? undefined);
  const isMobileLocked = !allowEditMobile && lockedTen != null && isValidIndianMobileTen(lockedTen);

  const executeSendOTP = useCallback(
    async (targetMobile: string) => {
      if (!isValidIndianMobileTen(targetMobile)) {
        toast.error('Please enter a valid 10-digit mobile number starting with 6–9');
        return;
      }

      try {
        const response = await sendOTP.mutateAsync({ mobile: targetMobile });
        if (response.auth_method === 'pin') {
          setStep('pin');
          toast.success(response.message || 'PIN login required');
        } else {
          setStep('otp');
          toast.success(response.message || 'OTP sent successfully');
        }
      } catch (error: unknown) {
        toast.error(getAxiosErrorMessage(error, 'Failed to process request'));
        setStep('phone');
      }
    },
    [sendOTP]
  );

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setMobile('');
      setCode(['', '', '', '']);
      setIsSubmitting(false);
      hasTriggeredRef.current = false;
      return;
    }

    if (lockedTen) {
      setMobile(lockedTen);
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        void executeSendOTP(lockedTen);
      }
    }
  }, [open, lockedTen, executeSendOTP]);

  useEffect(() => {
    if (!open || (step !== 'otp' && step !== 'pin')) return;

    const firstEmptyIndex = code.findIndex((digit) => digit === '');
    const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;

    const timer = window.setTimeout(() => {
      codeInputRefs.current[targetIndex]?.focus();
      codeInputRefs.current[targetIndex]?.select();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open, step, code]);

  if (!open) return null;

  const defaultDescription =
    step === 'phone'
      ? isMobileLocked
        ? 'We will send a verification code to the mobile number on your account.'
        : 'Enter your mobile number to receive a verification code.'
      : step === 'pin'
      ? 'PIN login required. Enter your 4-digit PIN to confirm deletion.'
      : `Enter the 4-digit code sent to +91 ${mobile}`;

  const handleSendSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    await executeSendOTP(mobile);
  };

  const handleVerifyCode = async (e?: React.FormEvent, customCode?: string) => {
    e?.preventDefault();
    const finalCode = customCode || code.join('');

    if (finalCode.length !== 4) {
      toast.error(`Please enter a valid 4-digit ${step === 'pin' ? 'PIN' : 'OTP'}`);
      return;
    }

    if (!isValidIndianMobileTen(mobile)) {
      toast.error('Invalid mobile number.');
      return;
    }

    let authToken: string | undefined;

    if (step === 'pin') {
      try {
        const pinRes = await verifyPINOnly.mutateAsync({ mobile, pin: finalCode, role: 'fan' });
        authToken = pinRes?.access_token;
      } catch (error: unknown) {
        toast.error(getAxiosErrorMessage(error, 'Incorrect PIN'));
        setCode(['', '', '', '']);
        codeInputRefs.current[0]?.focus();
        return;
      }
    } else {
      try {
        const otpRes = await verifyOTPOnly.mutateAsync({ mobile, otp: finalCode, role: 'fan' });
        authToken = otpRes?.access_token;
      } catch (error: unknown) {
        toast.error(getAxiosErrorMessage(error, 'Invalid OTP'));
        setCode(['', '', '', '']);
        codeInputRefs.current[0]?.focus();
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onVerified({ mobile, otp: finalCode, token: authToken });
      onClose();
    } catch (error: unknown) {
      toast.error(getAxiosErrorMessage(error, 'Something went wrong. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 3) {
      codeInputRefs.current[index + 1]?.focus();
    }

    if (newCode.every((d) => d !== '') && digit) {
      window.setTimeout(() => {
        const full = newCode.join('');
        if (full.length === 4) {
          void handleVerifyCode(undefined, full);
        }
      }, 250);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const isVerifying = step === 'pin' ? verifyPINOnly.isPending : verifyOTPOnly.isPending;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xl supports-[backdrop-filter]:bg-black/35"
      onClick={onClose}
    >
      <div className="w-full max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <Card className="border-zinc-800 bg-zinc-900/95 text-white backdrop-blur-xl">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight">
                {step === 'phone' ? (title ?? 'Verify Mobile') : step === 'pin' ? 'Verify PIN' : 'Verify OTP'}
              </h3>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            <p className="mb-5 text-sm text-zinc-400">
              {step === 'phone' ? (description ?? defaultDescription) : defaultDescription}
            </p>

            {step === 'phone' ? (
              <form onSubmit={(e) => void handleSendSubmit(e)} className="space-y-4">
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
                    'Send OTP'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={(e) => void handleVerifyCode(e)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      {step === 'pin' ? 'Security PIN' : 'Security code'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setStep('phone')}
                      className="text-xs font-medium text-purple-400 hover:underline"
                    >
                      Change number
                    </button>
                  </div>
                  <div className="flex justify-between gap-3">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          codeInputRefs.current[index] = el;
                        }}
                        type={step === 'pin' ? 'password' : 'text'}
                        inputMode="numeric"
                        autoComplete={step === 'pin' ? 'current-password' : 'one-time-code'}
                        value={digit}
                        onChange={(e) => handleCodeChange(e.target.value, index)}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                        className={cn(
                          'h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800 text-center text-lg font-bold outline-none transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500',
                          digit && 'border-purple-500 bg-zinc-800/80'
                        )}
                        disabled={isVerifying || isSubmitting}
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all hover:bg-purple-700 active:scale-[0.98]"
                  disabled={isVerifying || isSubmitting || code.join('').length < 4}
                >
                  {isVerifying || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-4 animate-spin" />
                      {isSubmitting ? 'Deleting account…' : 'Verifying…'}
                    </>
                  ) : step === 'pin' ? (
                    'Verify PIN'
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
                {step === 'otp' && (
                  <p className="text-center text-xs text-zinc-500">
                    Didn&apos;t receive a code?{' '}
                    <button
                      type="button"
                      className="font-medium text-purple-400 hover:underline"
                      onClick={() => void executeSendOTP(mobile)}
                      disabled={sendOTP.isPending}
                    >
                      Resend
                    </button>
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
