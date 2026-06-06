'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useSendOTP, useVerifyOTP, useSetupPIN } from '@/hooks/useAuth';
import { useUpdateFanCommonProfile } from '@/hooks/useFanCommonProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SignupModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'phone' | 'otp' | 'pin_setup' | 'demographics';

export function SignupModal({ open, onClose }: SignupModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  
  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [pin, setPin] = useState(['', '', '', '']);
  const [city, setCity] = useState('');
  const [dob, setDob] = useState(''); // YYYY-MM-DD

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOTP = useSendOTP();
  const verifyOTP = useVerifyOTP();
  const setupPIN = useSetupPIN();
  const updateProfile = useUpdateFanCommonProfile();

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setName('');
      setMobile('');
      setOtp(['', '', '', '']);
      setPin(['', '', '', '']);
      setCity('');
      setDob('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (step === 'otp') {
      const firstEmptyIndex = otp.findIndex((digit) => digit === '');
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      const timer = window.setTimeout(() => {
        otpInputRefs.current[targetIndex]?.focus();
        otpInputRefs.current[targetIndex]?.select();
      }, 0);
      return () => window.clearTimeout(timer);
    }

    if (step === 'pin_setup') {
      const firstEmptyIndex = pin.findIndex((digit) => digit === '');
      const targetIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
      const timer = window.setTimeout(() => {
        pinInputRefs.current[targetIndex]?.focus();
        pinInputRefs.current[targetIndex]?.select();
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [open, step, otp, pin]);

  if (!open) return null;

  const validateMobile = (phone: string) => /^[6-9]\d{9}$/.test(phone);

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!validateMobile(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }

    try {
      await sendOTP.mutateAsync({ mobile, role: 'fan' });
      toast.success('OTP sent successfully');
      setStep('otp');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to send OTP';
      toast.error(errorMessage);
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
      const res = await verifyOTP.mutateAsync({ mobile, otp: otpCode, role: 'fan' });
      
      // If it's a new user or onboarding is incomplete, push them through the onboarding flow
      if (res.is_new_user || res.user?.has_completed_onboarding === false) {
        setStep('pin_setup');
      } else {
        toast.success('Login successful!');
        onClose();
        router.push('/creators');
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Invalid OTP';
      toast.error(errorMessage);
      setOtp(['', '', '', '']);
      otpInputRefs.current[0]?.focus();
    }
  };

  const handleSetupPIN = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pinCode = pin.join('');

    if (pinCode.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    try {
      await setupPIN.mutateAsync({ pin: pinCode });
      setStep('demographics');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to set PIN';
      toast.error(errorMessage);
      setPin(['', '', '', '']);
      pinInputRefs.current[0]?.focus();
    }
  };

  const handleCompleteOnboarding = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!city.trim() || !dob.trim()) {
      toast.error('Please provide your city and date of birth');
      return;
    }

    try {
      await updateProfile.mutateAsync({
        name,
        mobile,
        username: name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(1000 + Math.random() * 9000), // Generate a fallback username
        city,
        date_of_birth: dob,
        avatar: null,
      });

      toast.success('Onboarding complete!');
      onClose();
      router.push('/creators');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to update profile';
      toast.error(errorMessage);
    }
  };

  // Input Handlers
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
        if (newOtp.join('').length === 4) handleVerifyOTP();
      }, 250);
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

    if (newPin.every((d) => d !== '') && digit) {
      setTimeout(() => {
        if (newPin.join('').length === 4) handleSetupPIN();
      }, 250);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    type: 'otp' | 'pin'
  ) => {
    const arr = type === 'otp' ? otp : pin;
    const refs = type === 'otp' ? otpInputRefs : pinInputRefs;

    if (e.key === 'Backspace' && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // Title Maps
  const titles: Record<Step, string> = {
    phone: 'Welcome to Zexy',
    otp: 'Verify OTP',
    pin_setup: 'Set Your Security PIN',
    demographics: 'Complete Your Profile'
  };

  const subtitles: Record<Step, string> = {
    phone: 'Enter your details to get started',
    otp: `Enter the 4-digit code sent to +91 ${mobile}`,
    pin_setup: 'Create a 4-digit PIN to secure your account',
    demographics: 'Tell us a bit more about yourself'
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xl supports-[backdrop-filter]:bg-black/35"
      onClick={onClose}
    >
      <div className="w-full max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <Card className="border-zinc-800 bg-zinc-900/95 text-white backdrop-blur-xl shadow-2xl">
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {step === 'otp' && (
                  <Button variant="ghost" size="icon" onClick={() => setStep('phone')} className="h-8 w-8 text-zinc-400 hover:text-white">
                    <ArrowLeft className="size-4" />
                  </Button>
                )}
                <h3 className="text-xl font-bold tracking-tight">{titles[step]}</h3>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-zinc-400 hover:text-white" aria-label="Close signup modal">
                <X className="size-4" />
              </Button>
            </div>

            <p className="mb-6 text-sm text-zinc-400">
              {subtitles[step]}
            </p>

            {/* STEP 1: IDENTITY (Name + Phone) */}
            {step === 'phone' && (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Full Name</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={sendOTP.isPending}
                    className="h-12 border-zinc-700 bg-zinc-800/50 text-base focus:border-purple-500 focus:bg-zinc-800"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 font-medium text-zinc-400">
                      +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={sendOTP.isPending}
                      className="h-12 flex-1 border-zinc-700 bg-zinc-800/50 text-lg tracking-wider focus:border-purple-500 focus:bg-zinc-800"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500 mt-2"
                  disabled={sendOTP.isPending || mobile.length < 10 || !name.trim()}
                >
                  {sendOTP.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-4 animate-spin" /> Sending...</>
                  ) : (
                    'Get Verification Code'
                  )}
                </Button>
              </form>
            )}

            {/* STEP 2: TRUST (OTP) */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Security Code</label>
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
                        onKeyDown={(e) => handleKeyDown(e, index, 'otp')}
                        className={cn(
                          'h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800/50 text-center text-xl font-bold outline-none transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:bg-zinc-800',
                          digit && 'border-purple-500 bg-zinc-800'
                        )}
                        disabled={verifyOTP.isPending}
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500"
                  disabled={verifyOTP.isPending || otp.join('').length < 4}
                >
                  {verifyOTP.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    'Verify & Continue'
                  )}
                </Button>
              </form>
            )}

            {/* STEP 3: SECURITY (PIN) */}
            {step === 'pin_setup' && (
              <form onSubmit={handleSetupPIN} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Create PIN</label>
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
                        onKeyDown={(e) => handleKeyDown(e, index, 'pin')}
                        className={cn(
                          'h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800/50 text-center text-2xl font-bold outline-none transition-all focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:bg-zinc-800',
                          digit && 'border-purple-500 bg-zinc-800'
                        )}
                        disabled={setupPIN.isPending}
                        maxLength={1}
                      />
                    ))}
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500"
                  disabled={setupPIN.isPending || pin.join('').length < 4}
                >
                  {setupPIN.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-4 animate-spin" /> Saving...</>
                  ) : (
                    'Set PIN & Continue'
                  )}
                </Button>
              </form>
            )}

            {/* STEP 4: DEMOGRAPHICS (City + DOB) */}
            {step === 'demographics' && (
              <form onSubmit={handleCompleteOnboarding} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">City</label>
                  <Input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={updateProfile.isPending}
                    className="h-12 border-zinc-700 bg-zinc-800/50 text-base focus:border-purple-500 focus:bg-zinc-800"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Date of Birth</label>
                  <Input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    disabled={updateProfile.isPending}
                    className="h-12 border-zinc-700 bg-zinc-800/50 text-base focus:border-purple-500 focus:bg-zinc-800 block w-full"
                    style={{ colorScheme: 'dark' }} // Ensures the native date picker calendar icon looks correct in dark mode
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500 mt-2"
                  disabled={updateProfile.isPending || !city.trim() || !dob.trim()}
                >
                  {updateProfile.isPending ? (
                    <><Loader2 className="mr-2 h-5 w-4 animate-spin" /> Saving...</>
                  ) : (
                    'Complete Setup'
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
