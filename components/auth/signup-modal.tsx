'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  X,
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  AtSign,
  Lock,
  User as UserIcon,
  Google,
  Mars,
  Venus,
  Genderless,
} from '@/components/ui/icons';
import Image from 'next/image';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/hooks/useAuth';
import { authService, User, VerifyOTPResponse } from '@/services/auth';
import { hasAllMandatoryDetails } from '@/lib/mockAuth';
import { signInWithGoogle, preloadGoogleSignIn } from '@/lib/firebase';
import { check, clean, dobBounds } from '@/lib/validation/fields';

export interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  initialView?: 'start' | 'complete_profile';
  redirectOnSuccess?: string;
}

// One form for login AND sign up (same flow as the creator app):
//   start (username | Google) -> login_pin  (username exists)
//                             -> signup          (new username: name + 4-digit PIN)
//   then complete_profile if mandatory fan details are missing.
type ModalView = 'start' | 'login_pin' | 'signup' | 'complete_profile';
type GenderOption = 'male' | 'female' | 'other';
type Tokens = { access_token: string; refresh_token?: string; session_token?: string };

const PIN_LEN = 4;

const inputCls =
  'h-12 pl-10 border-zinc-700 bg-zinc-800/60 text-sm focus:border-purple-500 focus:bg-zinc-800 text-white';
const primaryBtn = 'h-12 w-full rounded-full bg-purple-600 font-bold text-white hover:bg-purple-500 mt-2';

/** API errors arrive flat as "AUTH_029 - 401 - Incorrect username or PIN": show only the text. */
function errMsg(err: unknown, fallback: string): string {
  const e = err as { message?: string; response?: { data?: { message?: string; error?: { message?: string } } } };
  const flat = e?.response?.data?.message;
  if (flat) return flat.split(' - ').slice(2).join(' - ') || flat;
  return e?.response?.data?.error?.message || (e?.response ? fallback : e?.message || fallback);
}

export function SignupModal({
  open,
  onClose,
  initialView = 'start',
  redirectOnSuccess = '/creators',
}: SignupModalProps) {
  const router = useRouter();
  const { login } = useAuthContext();

  const [view, setView] = useState<ModalView>(initialView);
  const [busy, setBusy] = useState(false);

  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<GenderOption | ''>('');
  const [pendingTokens, setPendingTokens] = useState<Tokens | null>(null);

  // Warm the Google sign-in SDK while the modal is open (see preloadGoogleSignIn).
  useEffect(() => {
    if (open) preloadGoogleSignIn();
  }, [open]);

  useEffect(() => {
    if (open) return;
    setView(initialView);
    setBusy(false);
    setUsername('');
    setPin('');
    setConfirmPin('');
    setName('');
    setMobile('');
    setCity('');
    setDob('');
    setGender('');
    setPendingTokens(null);
  }, [open, initialView]);

  if (!open || typeof document === 'undefined') return null;

  const dobLimits = dobBounds();

  const finishLogin = (userData: User, tokens: Tokens, msg: string) => {
    login(tokens, userData);
    toast.success(msg);
    onClose();
    if (redirectOnSuccess) router.push(redirectOnSuccess);
  };

  /** Shared by PIN login, sign up and Google: store tokens, then finish or ask for missing details. */
  const afterAuth = async (tokenData: VerifyOTPResponse) => {
    const tokens: Tokens = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      session_token: tokenData.session_token,
    };
    localStorage.setItem('auth_token', tokens.access_token);
    if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token);
    if (tokens.session_token) localStorage.setItem('session_token', tokens.session_token);

    const me = await authService.getMe();
    if (me.has_completed_onboarding && hasAllMandatoryDetails(me)) {
      finishLogin(me, tokens, `Welcome back, ${me.name || me.username || 'Fan'}!`);
      return;
    }
    setPendingTokens(tokens);
    setName(me.name || name);
    setMobile(me.mobile ? me.mobile.replace(/\D/g, '').slice(-10) : '');
    setCity(me.city || '');
    setDob(me.date_of_birth || '');
    setGender((me.gender as GenderOption) || '');
    setView('complete_profile');
  };

  // ── Step 1: username decides login vs sign up ──────────────────────────────
  const handleUsernameNext = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const u = username.trim();
    if (!u) {
      toast.error('Username is required');
      return;
    }
    setBusy(true);
    try {
      const res = await authService.identify(u);
      if (res.exists) {
        setView('login_pin');
      } else {
        const formatError = check.username(u);
        if (formatError) {
          toast.error(formatError);
          return;
        }
        setView('signup');
      }
    } catch (err) {
      toast.error(errMsg(err, 'Unable to check username. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    try {
      await afterAuth(await authService.login(username.trim(), pin));
    } catch (err) {
      setPin('');
      toast.error(errMsg(err, 'Incorrect username or PIN'));
    } finally {
      setBusy(false);
    }
  };

  const handleSignup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const formError =
      check.name(name, 'Full name') ||
      (pin.length !== PIN_LEN ? `PIN must be exactly ${PIN_LEN} digits` : null) ||
      (pin !== confirmPin ? 'PINs do not match' : null);
    if (formError) {
      toast.error(formError);
      return;
    }
    setBusy(true);
    try {
      await afterAuth(await authService.signup({ username: username.trim(), pin, name: name.trim() }));
    } catch (err) {
      toast.error(errMsg(err, 'Sign up failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const { idToken } = await signInWithGoogle();
      if (!idToken) throw new Error('Google sign-in did not return a valid token.');
      await afterAuth(await authService.google(idToken));
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') toast.info('Google sign-in was cancelled');
      else if (code === 'auth/popup-blocked') toast.error('Sign-in popup was blocked by browser. Please allow popups.');
      else if (code === 'auth/unauthorized-domain') toast.error('Domain not authorized in Firebase Console.');
      else toast.error(errMsg(err, 'Google authentication failed. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  // ── Mandatory fan details (unchanged requirement: name, mobile, city, DOB, gender) ──
  const handleCompleteProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const profileError =
      check.name(name, 'Full name') ||
      check.mobile(mobile) ||
      check.place(city, 'City') ||
      check.dob(dob) ||
      (gender ? null : 'Please select your gender');
    if (profileError) {
      toast.error(profileError);
      return;
    }
    setBusy(true);
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
      finishLogin(updatedUser, tokens, 'Registration complete! Welcome to Zexy.');
    } catch (err) {
      toast.error(errMsg(err, 'Failed to complete profile. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const headers: Record<ModalView, { title: string; subtitle: string }> = {
    start: { title: 'Welcome to Zexy', subtitle: 'Log in or create an account' },
    login_pin: { title: 'Welcome back', subtitle: `Enter your 4-digit PIN for @${username.trim()}` },
    signup: { title: 'Create your account', subtitle: `@${username.trim()} is available` },
    complete_profile: { title: 'Complete Your Profile', subtitle: 'Please provide the mandatory details to access Zexy' },
  };
  const { title, subtitle } = headers[view];
  const showBack = view === 'login_pin' || view === 'signup';

  const spinner = (label: string) => (
    <>
      <Loader2 className="mr-2 size-4 animate-spin" /> {label}
    </>
  );

  // Portal to <body>: a parent with backdrop-filter/transform (e.g. the sticky header)
  // would otherwise trap this fixed backdrop inside itself and outside clicks would miss it.
  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
        <Card className="border-zinc-800 bg-zinc-900/95 text-white backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl relative">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#8c3df1] to-transparent" />

          <CardContent className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {showBack && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPin('');
                      setConfirmPin('');
                      setView('start');
                    }}
                    className="h-8 w-8 text-zinc-400 hover:text-white -ml-2"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="size-4" />
                  </Button>
                )}
                <Image
                  src="/zexy_z_letter_logo_nobg.png"
                  alt="Zexy logo"
                  width={24}
                  height={24}
                  className="size-6 object-contain"
                />
                <h3 className="text-lg font-bold tracking-tight text-white">{title}</h3>
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

            {/* ── START: username + Google ─────────────────────────────────── */}
            {view === 'start' && (
              <div className="space-y-4">
                <form onSubmit={handleUsernameNext} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="auth-username" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Username
                    </label>
                    <div className="relative">
                      <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                      <Input
                        id="auth-username"
                        placeholder="your_username"
                        value={username}
                        onChange={(e) => setUsername(clean.username(e.target.value))}
                        autoComplete="username"
                        autoCapitalize="none"
                        maxLength={30}
                        disabled={busy}
                        className={inputCls}
                        autoFocus
                      />
                    </div>
                  </div>
                  <Button type="submit" className={primaryBtn} disabled={busy || !username.trim()}>
                    {busy ? spinner('Checking…') : 'Continue'}
                  </Button>
                </form>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-zinc-800" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">or</span>
                  <div className="h-px flex-1 bg-zinc-800" />
                </div>

                <Button
                  type="button"
                  onClick={handleGoogle}
                  disabled={busy}
                  className="h-12 w-full rounded-full bg-white text-zinc-900 hover:bg-zinc-100 font-bold flex items-center justify-center gap-2"
                >
                  <Google className="size-4 shrink-0 text-[#4285F4]" />
                  <span>Continue with Google</span>
                </Button>

                <div className="pt-1 text-center text-[11px] text-zinc-500">
                  By continuing, you agree to Zexy&apos;s{' '}
                  <a href="https://zexy.live/terms-of-service" target="_blank" rel="noreferrer" className="text-zinc-400 underline hover:text-white">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="https://zexy.live/privacy-policy" target="_blank" rel="noreferrer" className="text-zinc-400 underline hover:text-white">
                    Privacy Policy
                  </a>
                  .
                </div>
              </div>
            )}

            {/* ── LOGIN: 4-digit PIN ──────────────────────────────────────────── */}
            {view === 'login_pin' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="hidden" name="username" autoComplete="username" value={username} readOnly />
                <div className="space-y-1.5">
                  <label htmlFor="auth-pin" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    4-Digit PIN
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="auth-pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="current-password"
                      disabled={busy}
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                </div>
                <Button type="submit" className={primaryBtn} disabled={busy || pin.length !== PIN_LEN}>
                  {busy ? spinner('Logging in…') : 'Log In'}
                </Button>
              </form>
            )}

            {/* ── SIGN UP: name + 4-digit PIN ─────────────────────────────────── */}
            {view === 'signup' && (
              <form onSubmit={handleSignup} className="space-y-4">
                <input type="hidden" name="username" autoComplete="username" value={username} readOnly />
                <div className="space-y-1.5">
                  <label htmlFor="auth-name" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Full Name <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="auth-name"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(clean.name(e.target.value))}
                      autoComplete="name"
                      maxLength={50}
                      disabled={busy}
                      className={inputCls}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="auth-new-pin" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Create 4-Digit PIN <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="auth-new-pin"
                      type="password"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="new-password"
                      disabled={busy}
                      className={inputCls}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-500">Exactly {PIN_LEN} digits. You&apos;ll use it to log in.</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="auth-confirm-pin" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Confirm PIN <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="auth-confirm-pin"
                      type="password"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      inputMode="numeric"
                      maxLength={4}
                      autoComplete="new-password"
                      disabled={busy}
                      className={inputCls}
                    />
                  </div>
                  {confirmPin && pin !== confirmPin && (
                    <p className="text-[11px] text-red-400">PINs do not match</p>
                  )}
                </div>
                <Button
                  type="submit"
                  className={primaryBtn}
                  disabled={busy || !name.trim() || pin.length !== PIN_LEN || pin !== confirmPin}
                >
                  {busy ? spinner('Creating account…') : 'Create Account'}
                </Button>
              </form>
            )}

            {/* ── COMPLETE PROFILE ─────────────────────────────────────────── */}
            {view === 'complete_profile' && (
              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="cp-name" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Full Name <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="cp-name"
                      value={name}
                      onChange={(e) => setName(clean.name(e.target.value))}
                      autoComplete="name"
                      maxLength={50}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cp-mobile" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Mobile Number <span className="text-purple-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 px-3.5 text-sm font-semibold text-zinc-300">
                      +91
                    </div>
                    <Input
                      id="cp-mobile"
                      type="tel"
                      placeholder="9876543210"
                      value={mobile}
                      onChange={(e) => setMobile(clean.mobile(e.target.value))}
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      className="h-12 flex-1 border-zinc-700 bg-zinc-800/60 text-base tracking-wider focus:border-purple-500 focus:bg-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cp-city" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    City <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                    <Input
                      id="cp-city"
                      placeholder="e.g. Mumbai, Delhi, Bengaluru"
                      value={city}
                      onChange={(e) => setCity(clean.place(e.target.value))}
                      autoComplete="address-level2"
                      maxLength={50}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="cp-dob" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Date of Birth (DOB) <span className="text-purple-400">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                    <Input
                      id="cp-dob"
                      type="date"
                      value={dob}
                      min={dobLimits.min}
                      max={dobLimits.max}
                      onChange={(e) => setDob(e.target.value)}
                      className={cn(inputCls, 'block w-full')}
                      style={{ colorScheme: 'dark' }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Gender <span className="text-purple-400">*</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: 'male', label: 'Male', Icon: Mars },
                        { id: 'female', label: 'Female', Icon: Venus },
                        { id: 'other', label: 'Other', Icon: Genderless },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setGender(item.id)}
                        aria-pressed={gender === item.id}
                        className={cn(
                          'h-11 rounded-full border border-zinc-700 bg-zinc-800/50 flex items-center justify-center gap-1.5 text-xs font-semibold',
                          gender === item.id
                            ? 'border-purple-500 bg-purple-600/20 text-purple-300 ring-1 ring-purple-500'
                            : 'text-zinc-300 hover:bg-zinc-800'
                        )}
                      >
                        <item.Icon className="size-4" aria-hidden />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  className={primaryBtn}
                  disabled={busy || !name.trim() || mobile.length < 10 || !city.trim() || !dob.trim() || !gender}
                >
                  {busy ? spinner('Saving…') : 'Complete Registration & Log In'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>,
    document.body
  );
}
