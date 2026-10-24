'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, ShieldCheck, Smartphone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface OtpVerificationModalProps {
  open: boolean;
  onClose: () => void;
  mobile?: string;
  newMobile?: string;
  title?: string;
  subtitle?: string;
  onVerify: (otp: string) => Promise<void> | void;
  onResend?: () => Promise<void> | void;
  isLoading?: boolean;
  isResending?: boolean;
  error?: string | null;
}

const RESEND_INTERVAL = 30;

export function OtpVerificationModal({
  open,
  onClose,
  mobile,
  newMobile,
  title,
  subtitle,
  onVerify,
  onResend,
  isLoading = false,
  isResending = false,
  error = null,
}: OtpVerificationModalProps) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(RESEND_INTERVAL);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state and focus first input when modal opens
  useEffect(() => {
    if (open) {
      setOtp(['', '', '', '']);
      setResendCountdown(RESEND_INTERVAL);
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Resend countdown timer
  useEffect(() => {
    if (!open || resendCountdown <= 0) return;
    const interval = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, resendCountdown]);

  const handleVerify = useCallback(
    async (codeToVerify?: string) => {
      const finalCode = codeToVerify || otp.join('');
      if (finalCode.length !== 4 || isLoading) return;

      try {
        await onVerify(finalCode);
      } catch {
        // Clear digits on error to allow fast retry
        setOtp(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    },
    [otp, isLoading, onVerify]
  );

  const handleDigitChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '');

    // Handle paste of multiple digits
    if (digits.length > 1) {
      const next = [...otp];
      for (let i = 0; i < 4; i++) {
        if (i < digits.length) next[i] = digits[i];
      }
      setOtp(next);
      const focusTarget = Math.min(digits.length, 3);
      inputRefs.current[focusTarget]?.focus();

      if (next.every((d) => d !== '')) {
        void handleVerify(next.join(''));
      }
      return;
    }

    const clean = digits.slice(-1);
    const next = [...otp];
    next[index] = clean;
    setOtp(next);

    if (clean && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (clean && next.every((d) => d !== '')) {
      void handleVerify(next.join(''));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const next = [...otp];
      next[index - 1] = '';
      setOtp(next);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const next = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtp(next);

    const focusTarget = Math.min(pasted.length, 3);
    inputRefs.current[focusTarget]?.focus();

    if (pasted.length === 4) {
      void handleVerify(pasted);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending || !onResend) return;
    setOtp(['', '', '', '']);
    setResendCountdown(RESEND_INTERVAL);
    inputRefs.current[0]?.focus();
    await onResend();
  };

  if (!open) return null;

  const phoneToFormat = mobile || newMobile || '';
  const formattedMobile = phoneToFormat
    ? phoneToFormat.startsWith('+')
      ? phoneToFormat
      : `+91 ${phoneToFormat}`
    : '';
  const isOtpComplete = otp.every((d) => d !== '');

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="w-full max-w-[380px]" onClick={(e) => e.stopPropagation()}>
        <Card className="relative border-zinc-800 bg-zinc-950 text-white shadow-2xl rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          <CardContent className="pt-8 pb-6 px-6 flex flex-col items-center text-center">
            {/* Header Icon */}
            <div className="size-14 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4 shadow-lg shadow-purple-500/10">
              <ShieldCheck className="size-7" />
            </div>

            {/* Title & Subtitle */}
            <h3 className="text-xl font-bold tracking-tight text-white mb-1.5">
              {title || 'Verify Mobile Number'}
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              {subtitle || 'Enter the 4-digit verification code sent to'}
            </p>

            {/* Formatted Phone Badge */}
            {formattedMobile ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-semibold text-purple-300 mb-6">
                <Smartphone className="size-3.5 text-purple-400" />
                {formattedMobile}
              </div>
            ) : null}

            {/* 4-digit OTP Inputs */}
            <div className="flex justify-between gap-3 w-full max-w-[260px] mb-4">
              {otp.map((digit, index) => (
                <input
                  key={`otp-input-${index}`}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  disabled={isLoading}
                  aria-label={`Digit ${index + 1}`}
                  className={cn(
                    'w-12 h-14 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-xl font-bold text-white',
                    'focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none',
                    digit && 'border-purple-500/80 bg-purple-500/5',
                    error && 'border-red-500/80 bg-red-500/5'
                  )}
                />
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-xs text-red-400 font-medium mb-4 px-2">
                {error}
              </p>
            )}

            {/* Resend Link / Timer */}
            <div className="text-xs text-zinc-400 mb-6">
              {resendCountdown > 0 ? (
                <span>
                  Resend code in <strong className="text-zinc-200">{resendCountdown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={isResending || isLoading}
                  className="text-purple-400 hover:text-purple-300 font-medium underline underline-offset-4 disabled:opacity-50"
                >
                  {isResending ? 'Resending code…' : 'Resend code'}
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleVerify()}
                disabled={!isOtpComplete || isLoading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Verifying…
                  </>
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default OtpVerificationModal;
