'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ArrowLeft,
  Smartphone,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/hooks/useAuth';
import { authService, User } from '@/services/auth';
import { hasAllMandatoryDetails } from '@/lib/mockAuth';
import { signInWithGoogle } from '@/lib/firebase';
import { ENV } from '@/constants/env';
import {
  triggerTruecallerVerification,
  isMobileDevice,
  isTruecallerSupported,
  markTruecallerUnavailable,
} from '@/lib/truecaller';

export interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  initialView?: 'options' | 'mobile_input' | 'complete_profile';
  redirectOnSuccess?: string;
}

type ModalView =
  | 'options'
  | 'mobile_input'
  | 'mobile_registered'
  | 'mobile_login_pin'
  | 'set_pin'
  | 'complete_profile'
  | 'truecaller_auth'
  | 'gmail_auth'
  | 'gmail_enter_mobile';

type GenderOption = 'male' | 'female' | 'other';

export function SignupModal({
  open,
  onClose,
  initialView = 'options',
  redirectOnSuccess = '/creators',
}: SignupModalProps) {
  const router = useRouter();
  const { login } = useAuthContext();

  const [view, setView] = useState<ModalView>(initialView);
  const [history, setHistory] = useState<ModalView[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [loginPin, setLoginPin] = useState(['', '', '', '']);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<GenderOption | ''>('');

  // Auxiliary state
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingTokens, setPendingTokens] = useState<{ access_token: string; refresh_token?: string; session_token?: string } | null>(null);
  const [authMethod, setAuthMethod] = useState<'mobile' | 'google' | 'truecaller'>('mobile');
  const [pendingOAuth, setPendingOAuth] = useState<{
    provider: 'google' | 'truecaller';
    idToken?: string;
    requestId?: string;
    accessToken?: string;
    phone?: string;
    name?: string;
    email?: string;
  } | null>(null);

  // Truecaller flow states
  const [isTruecallerAvailable, setIsTruecallerAvailable] = useState(false);
  const [isWaitingTruecaller, setIsWaitingTruecaller] = useState(false);

  // Input refs for PIN boxes
  const loginPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset or initialize state on modal open/close
  useEffect(() => {
    if (!open) {
      setView(initialView);
      setHistory([]);
      setName('');
      setMobile('');
      setLoginPin(['', '', '', '']);
      setPin(['', '', '', '']);
      setConfirmPin(['', '', '', '']);
      setCity('');
      setDob('');
      setGender('');
      setIsCheckingMobile(false);
      setUserEmail(null);
      setPendingTokens(null);
      setAuthMethod('mobile');
      setPendingOAuth(null);
      setIsWaitingTruecaller(false);
    } else {
      setIsTruecallerAvailable(isTruecallerSupported());
    }
  }, [open, initialView]);

  // Focus management for PIN inputs
  useEffect(() => {
    if (!open) return;
    if (view === 'mobile_login_pin') {
      const idx = loginPin.findIndex((d) => d === '');
      loginPinRefs.current[idx === -1 ? 0 : idx]?.focus();
    } else if (view === 'set_pin') {
      const pinIdx = pin.findIndex((d) => d === '');
      if (pinIdx !== -1) {
        pinRefs.current[pinIdx]?.focus();
      } else {
        const confIdx = confirmPin.findIndex((d) => d === '');
        confirmPinRefs.current[confIdx === -1 ? 0 : confIdx]?.focus();
      }
    }
  }, [open, view, loginPin, pin, confirmPin]);

  if (!open) return null;

  const navigateTo = (nextView: ModalView) => {
    setHistory((prev) => [...prev, view]);
    setView(nextView);
  };

  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((old) => old.slice(0, -1));
      setView(prev);
    } else {
      setView('options');
    }
  };

  const validateMobile = (phone: string) => /^[6-9]\d{9}$/.test(phone);

  // --------------------------------------------------------------------------
  // COMPLETE LOGIN HELPER
  // --------------------------------------------------------------------------
  const finishLogin = (
    userData: User,
    tokens: { access_token: string; refresh_token?: string; session_token?: string },
    toastMsg = 'Login successful!'
  ) => {
    login(tokens, userData);
    toast.success(toastMsg);
    onClose();
    if (redirectOnSuccess) {
      router.push(redirectOnSuccess);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 1: MOBILE NUMBER & NAME SUBMIT (Check Availability without OTP)
  // --------------------------------------------------------------------------
  const handleMobileStep1Next = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!validateMobile(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6–9');
      return;
    }

    setIsCheckingMobile(true);
    try {
      const res = await authService.checkMobile({ mobile, name: name.trim() });
      setIsCheckingMobile(false);

      if (res.exists) {
        // Step 2: Registered case -> Show message with "Go to Login"
        navigateTo('mobile_registered');
      } else {
        // Step 2: Not registered -> Proceed directly to PIN setup (no OTP)
        navigateTo('set_pin');
      }
    } catch (err: unknown) {
      setIsCheckingMobile(false);
      const msg = (err as { message?: string })?.message || 'Unable to verify mobile availability. Please try again.';
      toast.error(msg);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 2: REGISTERED CASE -> GO TO LOGIN WITH PIN
  // --------------------------------------------------------------------------
  const handleGoToLogin = () => {
    setLoginPin(['', '', '', '']);
    navigateTo('mobile_login_pin');
  };

  const handleMobileLoginWithPin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const enteredPin = loginPin.join('');

    if (enteredPin.length !== 4) {
      toast.error('Please enter your 4-digit PIN');
      return;
    }

    setIsCheckingMobile(true);
    try {
      let tokenData;
      if (authMethod === 'google' && pendingOAuth?.idToken) {
        tokenData = await authService.googleLogin({
          id_token: pendingOAuth.idToken,
          pin: enteredPin,
          role: 'fan',
          device_name: 'web',
        });
      } else if (authMethod === 'truecaller' && pendingOAuth) {
        tokenData = await authService.truecallerCallback({
          request_id: pendingOAuth.requestId,
          access_token: pendingOAuth.accessToken,
          phone: pendingOAuth.phone,
          name: pendingOAuth.name,
          pin: enteredPin,
          role: 'fan',
          device_name: 'web',
        });
      } else {
        tokenData = await authService.loginMobile({ mobile, pin: enteredPin });
      }

      const tokens = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        session_token: tokenData.session_token,
      };

      // Set auth tokens in localStorage so subsequent API calls are authenticated
      localStorage.setItem('auth_token', tokens.access_token);
      if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token);
      if (tokens.session_token) localStorage.setItem('session_token', tokens.session_token);

      const me = await authService.getMe();
      setIsCheckingMobile(false);

      if (me.has_completed_onboarding && hasAllMandatoryDetails(me)) {
        finishLogin(me, tokens, `Welcome back, ${me.name || name || 'Fan'}!`);
      } else {
        setPendingTokens(tokens);
        setName(me.name || name);
        setMobile(me.mobile ? me.mobile.replace(/\D/g, '').slice(-10) : mobile);
        setCity(me.city || '');
        setDob(me.date_of_birth || '');
        setGender((me.gender as GenderOption) || '');
        toast.info('Please complete your missing profile details to continue.');
        navigateTo('complete_profile');
      }
    } catch (err: unknown) {
      setIsCheckingMobile(false);
      setLoginPin(['', '', '', '']);
      loginPinRefs.current[0]?.focus();
      const msg = (err as { message?: string })?.message || 'Invalid credentials or incorrect PIN.';
      toast.error(msg);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 3: SET 4-DIGIT PIN & CONFIRM PIN (Creates account without OTP)
  // --------------------------------------------------------------------------
  const handleSetPinNext = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pinStr = pin.join('');
    const confirmStr = confirmPin.join('');

    if (pinStr.length !== 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    if (confirmStr.length !== 4) {
      toast.error('Please confirm your 4-digit PIN');
      return;
    }

    if (pinStr !== confirmStr) {
      toast.error('PINs do not match. Please verify.');
      return;
    }

    setIsCheckingMobile(true);
    try {
      let tokenData;
      if (authMethod === 'google' && pendingOAuth?.idToken) {
        tokenData = await authService.googleLogin({
          id_token: pendingOAuth.idToken,
          pin: pinStr,
          confirm_pin: confirmStr,
          role: 'fan',
          device_name: 'web',
        });
      } else if (authMethod === 'truecaller' && pendingOAuth) {
        tokenData = await authService.truecallerCallback({
          request_id: pendingOAuth.requestId,
          access_token: pendingOAuth.accessToken,
          phone: pendingOAuth.phone,
          name: pendingOAuth.name,
          pin: pinStr,
          confirm_pin: confirmStr,
          role: 'fan',
          device_name: 'web',
        });
      } else {
        tokenData = await authService.signupSetPin({
          mobile,
          name: name.trim(),
          pin: pinStr,
          confirm_pin: confirmStr,
        });
      }

      const tokens = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        session_token: tokenData.session_token,
      };

      setPendingTokens(tokens);
      localStorage.setItem('auth_token', tokens.access_token);
      if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token);
      if (tokens.session_token) localStorage.setItem('session_token', tokens.session_token);

      const me = await authService.getMe();
      setIsCheckingMobile(false);

      if (authMethod === 'google' && !me.mobile) {
        setMobile('');
        navigateTo('gmail_enter_mobile');
      } else {
        setMobile(me.mobile ? me.mobile.replace(/\D/g, '').slice(-10) : mobile);
        navigateTo('complete_profile');
      }
    } catch (err: unknown) {
      setIsCheckingMobile(false);
      const msg = (err as { message?: string })?.message || 'Failed to setup PIN. Please try again.';
      toast.error(msg);
    }
  };

  // --------------------------------------------------------------------------
  // STEP 4: COMPLETE PROFILE (City, DOB, Gender + Mandatory Verification)
  // --------------------------------------------------------------------------
  const handleCompleteProfileSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!name.trim()) {
      toast.error('Full Name is required');
      return;
    }

    if (!validateMobile(mobile)) {
      toast.error('Valid 10-digit Mobile Number is required');
      return;
    }

    if (!city.trim()) {
      toast.error('Please enter your City');
      return;
    }

    if (!dob.trim()) {
      toast.error('Please provide your Date of Birth (DOB)');
      return;
    }

    if (!gender) {
      toast.error('Please select your Gender');
      return;
    }

    setIsCheckingMobile(true);
    try {
      const updatedUser = await authService.updateProfile({
        name: name.trim(),
        mobile,
        city: city.trim(),
        date_of_birth: dob,
        gender,
      });

      const tokens = pendingTokens || {
        access_token: localStorage.getItem('auth_token') || '',
        refresh_token: localStorage.getItem('refresh_token') || undefined,
        session_token: localStorage.getItem('session_token') || undefined,
      };

      setIsCheckingMobile(false);
      finishLogin(updatedUser, tokens, 'Registration complete! Welcome to Zexy.');
    } catch (err: unknown) {
      setIsCheckingMobile(false);
      const msg = (err as { message?: string })?.message || 'Failed to complete profile. Please try again.';
      toast.error(msg);
    }
  };

  // --------------------------------------------------------------------------
  // TRUECALLER AUTHENTICATION FLOW
  // --------------------------------------------------------------------------
  const handleTruecallerOneTap = () => {
    if (!ENV.TRUECALLER_PARTNER_KEY) {
      toast.error('Truecaller Partner Key is missing in environment configuration.');
      return;
    }

    const onMobile = isMobileDevice();
    if (!onMobile) {
      setIsTruecallerAvailable(false);
      markTruecallerUnavailable();
      toast.info('Truecaller is not available on this device.');
      navigateTo('options');
      return;
    }

    setIsWaitingTruecaller(true);
    triggerTruecallerVerification({
      loginPrefix: 'logIn',
      onAppOpened: () => {
        setIsWaitingTruecaller(true);
      },
      onAppNotFound: () => {
        setIsWaitingTruecaller(false);
        setIsTruecallerAvailable(false);
        markTruecallerUnavailable();
        toast.error('Truecaller app is not installed on this mobile device. Option has been removed.');
        navigateTo('options');
      },
    });
  };

  // --------------------------------------------------------------------------
  // GMAIL AUTHENTICATION FLOW (REAL FIREBASE GOOGLE SIGN-IN)
  // --------------------------------------------------------------------------
  const handleGmailAuthSubmit = async () => {
    setIsCheckingMobile(true);
    try {
      const { idToken, name: gName, email: gEmail } = await signInWithGoogle();

      if (!idToken) {
        throw new Error('Google sign-in did not return a valid authentication token.');
      }

      const targetName = gName || 'Google User';
      const targetEmail = gEmail || '';

      setName(targetName);
      setUserEmail(targetEmail);

      const checkRes = await authService.checkGoogle({ id_token: idToken });
      setIsCheckingMobile(false);

      setAuthMethod('google');
      setPendingOAuth({
        provider: 'google',
        idToken,
        name: checkRes.name || targetName,
        email: checkRes.email || targetEmail,
      });

      if (checkRes.exists && checkRes.has_pin) {
        setLoginPin(['', '', '', '']);
        navigateTo('mobile_login_pin');
      } else {
        setPin(['', '', '', '']);
        setConfirmPin(['', '', '', '']);
        navigateTo('set_pin');
      }
    } catch (err: unknown) {
      setIsCheckingMobile(false);
      const fbErr = err as {
        code?: string;
        message?: string;
        response?: { data?: { detail?: string; message?: string } };
      };

      if (fbErr?.code === 'auth/popup-closed-by-user') {
        toast.info('Google sign-in was cancelled');
        return;
      }
      if (fbErr?.code === 'auth/popup-blocked') {
        toast.error('Sign-in popup was blocked by browser. Please allow popups.');
        return;
      }
      if (fbErr?.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase Console. Please add localhost to Authorized Domains.');
        return;
      }

      const msg =
        fbErr?.response?.data?.detail ||
        fbErr?.response?.data?.message ||
        fbErr?.message ||
        'Google authentication failed. Please try again.';
      toast.error(msg);
    }
  };

  const handleGmailMobileSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!validateMobile(mobile)) {
      toast.error('Please enter a valid 10-digit mobile number starting with 6–9');
      return;
    }

    setIsCheckingMobile(true);
    try {
      const check = await authService.checkMobile({ mobile, name });
      setIsCheckingMobile(false);

      if (check.exists) {
        navigateTo('mobile_registered');
      } else {
        toast.info('Mobile verified! Please complete your profile details.');
        navigateTo('complete_profile');
      }
    } catch (err: unknown) {
      setIsCheckingMobile(false);
      const msg = (err as { message?: string })?.message || 'Failed to verify mobile availability. Please try again.';
      toast.error(msg);
    }
  };

  // --------------------------------------------------------------------------
  // PIN BOX DIGIT HANDLERS
  // --------------------------------------------------------------------------
  const handleDigitChange = (
    value: string,
    index: number,
    arr: string[],
    setArr: (next: string[]) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    if (!digit && value !== '') return;

    const copy = [...arr];
    copy[index] = digit;
    setArr(copy);

    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    arr: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>
  ) => {
    if (e.key === 'Backspace' && !arr[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  // --------------------------------------------------------------------------
  // TITLES & SUBTITLES
  // --------------------------------------------------------------------------
  const getHeader = () => {
    switch (view) {
      case 'options':
        return {
          title: 'Welcome to Zexy',
          subtitle: 'Choose your preferred login or signup method',
        };
      case 'mobile_input':
        return {
          title: 'Mobile Login / Signup',
          subtitle: 'Enter your name and mobile number to proceed',
        };
      case 'mobile_registered':
        return {
          title: 'Account Found',
          subtitle: 'Your mobile number is already registered with Zexy',
        };
      case 'mobile_login_pin':
        return {
          title: 'Log In with PIN',
          subtitle:
            authMethod === 'google'
              ? `Enter your 4-digit PIN for ${userEmail || name || 'your Google account'}`
              : `Enter your 4-digit PIN for +91 ${mobile}`,
        };
      case 'set_pin':
        return {
          title: 'Set Your Security PIN',
          subtitle:
            authMethod === 'google'
              ? `Create and confirm a 4-digit PIN for ${userEmail || name || 'your Google account'}`
              : `Create and confirm a 4-digit PIN for ${mobile ? `+91 ${mobile}` : 'your account'}`,
        };
      case 'complete_profile':
        return {
          title: 'Complete Your Profile',
          subtitle: 'Please provide the mandatory details to access Zexy',
        };
      case 'truecaller_auth':
        return {
          title: 'Truecaller Verification',
          subtitle: 'Instant 1-tap mobile identity verification',
        };
      case 'gmail_auth':
        return {
          title: 'Google Sign-In',
          subtitle: 'Choose a Google account to continue',
        };
      case 'gmail_enter_mobile':
        return {
          title: 'Link Mobile Number',
          subtitle: `Linking mobile number for ${name} (${userEmail})`,
        };
      default:
        return { title: 'Welcome to Zexy', subtitle: '' };
    }
  };

  const { title, subtitle } = getHeader();
  const showBackButton = view !== 'options';

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-zinc-800 bg-zinc-900/95 text-white backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl relative">
          {/* Subtle top brand glow */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#8c3df1] to-transparent" />

          <CardContent className="p-6">
            {/* Header / Nav */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showBackButton && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="h-8 w-8 text-zinc-400 hover:text-white -ml-2"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <Image
                    src="/zexy_z_letter_logo_nobg.png"
                    alt="Zexy logo"
                    width={24}
                    height={24}
                    className="size-6 object-contain"
                  />
                  <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-zinc-400 hover:text-white"
                aria-label="Close login popup"
              >
                <X className="size-4" />
              </Button>
            </div>

            {subtitle && <p className="mb-6 text-xs text-zinc-400">{subtitle}</p>}

            {/* =============================================================== */}
            {/* VIEW 1: INITIAL 3 LOGIN OPTIONS                                  */}
            {/* =============================================================== */}
            {view === 'options' && (
              <div className="space-y-3.5">
                {/* Option 1: Mobile */}
                <button
                  type="button"
                  onClick={() => {
                    navigateTo('mobile_input');
                  }}
                  className="w-full group flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800 hover:border-purple-500/50 transition-all duration-200 active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Smartphone className="size-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Log in with Mobile</div>
                      <div className="text-[11px] text-zinc-400">Mobile number & PIN verification</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-purple-400 group-hover:translate-x-0.5 transition-transform">
                    →
                  </span>
                </button>

                {/* Option 2: Truecaller (only if available on mobile) */}
                {isTruecallerAvailable && (
                  <button
                    type="button"
                    onClick={() => navigateTo('truecaller_auth')}
                    className="w-full group flex items-center justify-between p-4 rounded-xl border border-blue-900/40 bg-blue-950/20 hover:bg-blue-950/40 hover:border-blue-500/60 transition-all duration-200 active:scale-[0.99] text-left"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="size-11 rounded-xl bg-[#0087FF]/20 border border-[#0087FF]/40 flex items-center justify-center text-[#0087FF] group-hover:bg-[#0087FF] group-hover:text-white transition-colors">
                        <PhoneCall className="size-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white flex items-center gap-1.5">
                          Log in with Truecaller
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0087FF]/20 text-[#0087FF] font-bold">
                            1-Tap
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">Instant verified mobile identity</div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[#0087FF] group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </button>
                )}

                {/* Option 3: Gmail */}
                <button
                  type="button"
                  onClick={handleGmailAuthSubmit}
                  disabled={isCheckingMobile}
                  className="w-full group flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-800/40 hover:bg-zinc-800 hover:border-zinc-600 transition-all duration-200 active:scale-[0.99] text-left disabled:opacity-60"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="size-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                      <svg className="size-5" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Log in with Gmail</div>
                      <div className="text-[11px] text-zinc-400">Continue with Google account</div>
                    </div>
                  </div>
                  {isCheckingMobile ? (
                    <Loader2 className="size-4 animate-spin text-purple-400" />
                  ) : (
                    <span className="text-xs font-semibold text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  )}
                </button>

                <div className="pt-3 text-center text-[11px] text-zinc-500">
                  By continuing, you agree to Zexy&apos;s{' '}
                  <a
                    href="https://zexy.live/terms-of-service"
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 underline hover:text-white"
                  >
                    Terms
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://zexy.live/privacy-policy"
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-400 underline hover:text-white"
                  >
                    Privacy Policy
                  </a>
                  .
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* VIEW 2: STEP 1 - ENTER MOBILE NUMBER & NAME                      */}
            {/* =============================================================== */}
            {view === 'mobile_input' && (
              <form onSubmit={handleMobileStep1Next} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Full Name <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isCheckingMobile}
                      className="h-12 pl-10 border-zinc-700 bg-zinc-800/60 text-sm focus:border-purple-500 focus:bg-zinc-800 text-white"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Mobile Number <span className="text-purple-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 text-sm font-semibold text-zinc-300">
                      🇮🇳 +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={isCheckingMobile}
                      className="h-12 flex-1 border-zinc-700 bg-zinc-800/60 text-base tracking-wider focus:border-purple-500 focus:bg-zinc-800 text-white"
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Enter a valid 10-digit number. (Demo: enter 9876543210 for existing user)
                  </p>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500 mt-4"
                  disabled={isCheckingMobile || mobile.length < 10 || !name.trim()}
                >
                  {isCheckingMobile ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Checking availability…
                    </>
                  ) : (
                    'Next'
                  )}
                </Button>
              </form>
            )}

            {/* =============================================================== */}
            {/* VIEW 3: STEP 2 - CHECK AVAILABILITY (ALREADY REGISTERED)         */}
            {/* =============================================================== */}
            {view === 'mobile_registered' && (
              <div className="space-y-5 py-2">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center space-y-2">
                  <AlertCircle className="size-8 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Mobile Already Registered</h4>
                  <p className="text-xs text-zinc-300">
                    The mobile number <span className="font-semibold text-white">+91 {mobile}</span> is
                    already associated with an existing Zexy account.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-800/40 text-center space-y-3">
                  <p className="text-xs text-zinc-400">
                    Already have an account? Please proceed with PIN login.
                  </p>

                  <button
                    type="button"
                    onClick={handleGoToLogin}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors"
                  >
                    Go to Login →
                  </button>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setMobile('');
                      setView('mobile_input');
                    }}
                    className="h-11 w-full border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 text-xs text-zinc-300"
                  >
                    Use a different mobile number
                  </Button>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* VIEW 4: STEP 2 (LOGIN WITH PIN)                                  */}
            {/* =============================================================== */}
            {view === 'mobile_login_pin' && (
              <form onSubmit={handleMobileLoginWithPin} className="space-y-5">
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-zinc-400">Logging in for: </span>
                    <span className="font-semibold text-white">
                      {authMethod === 'google'
                        ? (userEmail || name || 'Google Account')
                        : `+91 ${mobile}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('mobile');
                      setPendingOAuth(null);
                      setView(authMethod === 'mobile' ? 'mobile_input' : 'options');
                    }}
                    className="text-[11px] font-medium text-purple-400 hover:underline"
                  >
                    Change
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Enter 4-Digit PIN <span className="text-purple-400">*</span>
                  </label>
                  <div className="flex justify-between gap-3">
                    {loginPin.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          loginPinRefs.current[idx] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleDigitChange(e.target.value, idx, loginPin, setLoginPin, loginPinRefs)
                        }
                        onKeyDown={(e) =>
                          handleDigitKeyDown(e, idx, loginPin, loginPinRefs)
                        }
                        className={cn(
                          'h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800/50 text-center text-2xl font-bold outline-none transition-all focus:border-purple-500 focus:bg-zinc-800 text-white',
                          digit && 'border-purple-500 bg-zinc-800'
                        )}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-zinc-500">Demo PIN: 1234</p>
                    <button
                      type="button"
                      onClick={() => toast.info('For this UI demo, you can enter PIN: 1234')}
                      className="text-[11px] text-purple-400 hover:underline"
                    >
                      Forgot PIN?
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500 mt-3"
                  disabled={loginPin.join('').length < 4}
                >
                  Log In
                </Button>
              </form>
            )}

            {/* =============================================================== */}
            {/* VIEW 5: STEP 3 - SET PIN & CONFIRM PIN                           */}
            {/* =============================================================== */}
            {view === 'set_pin' && (
              <form onSubmit={handleSetPinNext} className="space-y-5">
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-zinc-400">Setting PIN for: </span>
                    <span className="font-semibold text-white">
                      {authMethod === 'google'
                        ? (userEmail || name || 'Google Account')
                        : mobile
                        ? `+91 ${mobile}`
                        : (name || 'New Account')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('mobile');
                      setPendingOAuth(null);
                      setView(authMethod === 'mobile' ? 'mobile_input' : 'options');
                    }}
                    className="text-[11px] font-medium text-purple-400 hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* Enter PIN */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Create 4-Digit PIN <span className="text-purple-400">*</span>
                  </label>
                  <div className="flex justify-between gap-3">
                    {pin.map((digit, idx) => (
                      <input
                        key={`pin-${idx}`}
                        ref={(el) => {
                          pinRefs.current[idx] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleDigitChange(e.target.value, idx, pin, setPin, pinRefs)
                        }
                        onKeyDown={(e) => handleDigitKeyDown(e, idx, pin, pinRefs)}
                        className={cn(
                          'h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800/50 text-center text-2xl font-bold outline-none transition-all focus:border-purple-500 focus:bg-zinc-800 text-white',
                          digit && 'border-purple-500 bg-zinc-800'
                        )}
                      />
                    ))}
                  </div>
                </div>

                {/* Confirm PIN */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Confirm 4-Digit PIN <span className="text-purple-400">*</span>
                  </label>
                  <div className="flex justify-between gap-3">
                    {confirmPin.map((digit, idx) => (
                      <input
                        key={`confirm-${idx}`}
                        ref={(el) => {
                          confirmPinRefs.current[idx] = el;
                        }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          handleDigitChange(
                            e.target.value,
                            idx,
                            confirmPin,
                            setConfirmPin,
                            confirmPinRefs
                          )
                        }
                        onKeyDown={(e) =>
                          handleDigitKeyDown(e, idx, confirmPin, confirmPinRefs)
                        }
                        className={cn(
                          'h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800/50 text-center text-2xl font-bold outline-none transition-all focus:border-purple-500 focus:bg-zinc-800 text-white',
                          digit && 'border-purple-500 bg-zinc-800'
                        )}
                      />
                    ))}
                  </div>
                  {pin.join('').length === 4 && confirmPin.join('').length === 4 && (
                    <div className="flex items-center gap-1.5 text-xs pt-1">
                      {pin.join('') === confirmPin.join('') ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="size-3.5" /> PINs match
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400">
                          <AlertCircle className="size-3.5" /> PINs do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500 mt-2"
                  disabled={
                    pin.join('').length < 4 ||
                    confirmPin.join('').length < 4 ||
                    pin.join('') !== confirmPin.join('')
                  }
                >
                  Next
                </Button>
              </form>
            )}

            {/* =============================================================== */}
            {/* VIEW 6: STEP 4 - COMPLETE PROFILE (CITY, DOB, GENDER)            */}
            {/* =============================================================== */}
            {view === 'complete_profile' && (
              <form onSubmit={handleCompleteProfileSubmit} className="space-y-4">
                {/* Summary badges */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-2.5">
                    <span className="text-zinc-500 block text-[10px] uppercase">Name</span>
                    <span className="font-semibold text-white truncate block">{name || '—'}</span>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/40 p-2.5">
                    <span className="text-zinc-500 block text-[10px] uppercase">Mobile</span>
                    <span className="font-semibold text-white block">
                      {mobile ? `+91 ${mobile}` : '—'}
                    </span>
                  </div>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    City <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      type="text"
                      placeholder="e.g. Mumbai, Delhi, Bengaluru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="h-11 pl-10 border-zinc-700 bg-zinc-800/60 text-sm focus:border-purple-500 focus:bg-zinc-800 text-white"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Date of Birth (DOB) <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={dob}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setDob(e.target.value)}
                      className="h-11 pl-10 border-zinc-700 bg-zinc-800/60 text-sm focus:border-purple-500 focus:bg-zinc-800 text-white block w-full"
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Gender <span className="text-purple-400">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'male', label: 'Male', emoji: '👨' },
                        { id: 'female', label: 'Female', emoji: '👩' },
                        { id: 'other', label: 'Other', emoji: '⚧' },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGender(item.id)}
                        className={cn(
                          'h-11 rounded-xl border border-zinc-700 bg-zinc-800/50 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all active:scale-[0.98]',
                          gender === item.id
                            ? 'border-purple-500 bg-purple-600/20 text-purple-300 ring-1 ring-purple-500'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        )}
                      >
                        <span>{item.emoji}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500 mt-2"
                  disabled={!city.trim() || !dob.trim() || !gender}
                >
                  Complete Registration & Log In
                </Button>
              </form>
            )}

            {/* =============================================================== */}
            {/* VIEW 7: TRUECALLER AUTHENTICATION (1-TAP & SIMULATION)           */}
            {/* =============================================================== */}
            {view === 'truecaller_auth' && (
              <div className="space-y-4 py-1">
                {/* Header Banner */}
                <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/10 text-center space-y-1">
                  <div className="size-10 rounded-full bg-[#0087FF] text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/30">
                    <PhoneCall className="size-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">Truecaller 1-Tap Verification</h4>
                  <p className="text-[11px] text-zinc-300">
                    Instant verified phone number identity powered by Truecaller
                  </p>
                </div>

                <div className="space-y-3">
                  {isWaitingTruecaller ? (
                    <div className="p-5 rounded-xl border border-blue-500/40 bg-blue-950/20 text-center space-y-3">
                      <div className="relative size-14 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-[#0087FF]/20 animate-ping" />
                        <div className="size-11 rounded-full bg-[#0087FF] text-white flex items-center justify-center shadow-lg shadow-blue-500/40">
                          <PhoneCall className="size-5" />
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Truecaller App Prompt Triggered</div>
                        <div className="text-[11px] text-zinc-400 mt-1">
                          Please confirm the verification overlay in Truecaller on your device.
                        </div>
                      </div>
                      <div className="pt-2 flex flex-col gap-2">
                        <Button
                          type="button"
                          onClick={handleTruecallerOneTap}
                          className="w-full h-10 text-xs bg-[#0087FF] hover:bg-[#0077e6] text-white font-semibold rounded-lg"
                        >
                          Open Truecaller Again
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsWaitingTruecaller(false)}
                          className="w-full h-9 text-xs text-zinc-400 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <span className="size-2 rounded-full bg-emerald-400" />
                          Ready to verify
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Clicking below triggers Truecaller&apos;s native bottom sheet on Android mobile browsers to verify your phone without OTP.
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handleTruecallerOneTap}
                        className="h-12 w-full rounded-xl bg-gradient-to-r from-[#0087FF] to-[#0066CC] hover:from-[#0077e6] hover:to-[#0055b3] font-bold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                      >
                        <PhoneCall className="size-4" />
                        <span>Launch Truecaller 1-Tap</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* VIEW 8: GMAIL AUTHENTICATION (FIREBASE GOOGLE SIGN-IN)           */}
            {/* =============================================================== */}
            {view === 'gmail_auth' && (
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-800/50 flex items-center gap-3.5">
                  <div className="size-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                    <svg className="size-5" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-white">Google Sign-In</div>
                    <div className="text-xs text-zinc-400">Continue with your verified Google account</div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-xs text-zinc-400 space-y-2">
                  <p>
                    Clicking continue will open the secure Google Sign-In popup. Select your account to sign in or create an account for Zexy.
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleGmailAuthSubmit}
                  disabled={isCheckingMobile}
                  className="h-12 w-full rounded-xl bg-white text-zinc-900 hover:bg-zinc-100 font-bold transition-all active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
                >
                  {isCheckingMobile ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-purple-600" />
                      <span>Connecting to Google…</span>
                    </>
                  ) : (
                    <>
                      <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 17c1.8 3.7 5.6 6.5 10.1 6.5z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* =============================================================== */}
            {/* VIEW 9: GMAIL - LINK MOBILE NUMBER                               */}
            {/* =============================================================== */}
            {view === 'gmail_enter_mobile' && (
              <form onSubmit={handleGmailMobileSubmit} className="space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3 text-xs text-zinc-300">
                  <span className="text-zinc-500 block text-[10px] uppercase">Authenticated via Google</span>
                  <span className="font-semibold text-white">
                    {name} ({userEmail})
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Enter Mobile Number <span className="text-purple-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 text-sm font-semibold text-zinc-300">
                      🇮🇳 +91
                    </div>
                    <Input
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      disabled={isCheckingMobile}
                      className="h-12 flex-1 border-zinc-700 bg-zinc-800/60 text-base tracking-wider focus:border-purple-500 focus:bg-zinc-800 text-white"
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    A mobile number is required to secure your account.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-purple-600 font-bold text-white transition-all active:scale-[0.98] hover:bg-purple-500 mt-2"
                  disabled={isCheckingMobile || mobile.length < 10}
                >
                  {isCheckingMobile ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    'Next'
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
