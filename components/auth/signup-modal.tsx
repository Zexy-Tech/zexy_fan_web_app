'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  X,
  Loader2,
  Calendar,
  MapPin,
  User as UserIcon,
  Lock,
  Video,
  Heart,
  ShieldCheck,
  Mars,
  Venus,
  Genderless,
} from '@/components/ui/icons';
import Image from 'next/image';
import { toast } from '@/lib/toast';
import { Input } from '@/components/ui/input';
import { GoogleLogo } from '@/components/ui/google-logo';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/hooks/useAuth';
import { authService, User, AuthTokens } from '@/services/auth';
import { hasAllMandatoryDetails } from '@/lib/mockAuth';
import { signInWithGoogle, preloadGoogleSignIn } from '@/lib/firebase';
import { check, clean, dobBounds } from '@/lib/validation/fields';

// Google is the only login and sign up (same as the creator + admin apps):
//   start (Google) -> complete_profile if mandatory fan details are missing.
// SignupPanel is the card itself: the /login page shows it inline, SignupModal shows it as a popup.
type ModalView = 'start' | 'complete_profile';
type GenderOption = 'male' | 'female' | 'other';
type Tokens = { access_token: string; refresh_token?: string; session_token?: string };

const PERKS = [
  { Icon: Lock, label: 'Exclusive drops' },
  { Icon: Video, label: 'Live & 1:1' },
  { Icon: Heart, label: 'Support creators' },
] as const;

const labelCls = 'text-xs font-semibold uppercase tracking-wider text-muted-foreground';
const inputCls = 'h-12 pl-10 bg-muted/40 text-sm focus-visible:ring-purple-500';
const iconCls = 'absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none';
const primaryBtn =
  'mt-2 flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:opacity-95 active:scale-[0.99] disabled:opacity-50 disabled:shadow-none';

/** API errors arrive flat as "AUTH_003 - 401 - Invalid Google token": show only the text. */
function errMsg(err: unknown, fallback: string): string {
  const e = err as { message?: string; response?: { data?: { message?: string; error?: { message?: string } } } };
  const flat = e?.response?.data?.message;
  if (flat) return flat.split(' - ').slice(2).join(' - ') || flat;
  return e?.response?.data?.error?.message || (e?.response ? fallback : e?.message || fallback);
}

export interface SignupPanelProps {
  initialView?: ModalView;
  redirectOnSuccess?: string;
  /** Shows a close button; also called after a successful login. */
  onClose?: () => void;
}

export function SignupPanel({ initialView = 'start', redirectOnSuccess = '/creators', onClose }: SignupPanelProps) {
  const router = useRouter();
  const { login } = useAuthContext();

  const [view, setView] = useState<ModalView>(initialView);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<GenderOption | ''>('');
  const [pendingTokens, setPendingTokens] = useState<Tokens | null>(null);

  // Warm the Google sign-in SDK so the popup opens right on tap (see preloadGoogleSignIn).
  useEffect(preloadGoogleSignIn, []);

  const dobLimits = dobBounds();

  const finishLogin = (userData: User, tokens: Tokens, msg: string) => {
    login(tokens, userData);
    toast.success(msg);
    onClose?.();
    if (redirectOnSuccess) router.push(redirectOnSuccess);
  };

  /** After Google: store tokens, then finish or ask for missing details. */
  const afterAuth = async (tokenData: AuthTokens) => {
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
    setName(me.name || '');
    setMobile(me.mobile ? me.mobile.replace(/\D/g, '').slice(-10) : '');
    setCity(me.city || '');
    setDob(me.date_of_birth || '');
    setGender((me.gender as GenderOption) || '');
    setView('complete_profile');
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

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl shadow-purple-500/10 dark:shadow-black/50">
      {/* Brand glow + hairline */}
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 h-48 w-80 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl dark:bg-purple-600/30" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" />

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}

      <div className="relative p-6 sm:p-8">
        {view === 'start' ? (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 ring-1 ring-purple-500/20">
                <Image src="/zexy_z_letter_logo_nobg.png" alt="Zexy" width={40} height={40} className="size-10 object-contain" priority />
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                Get closer to the{' '}
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">creators you love</span>
              </h2>
              <p className="mt-2 max-w-[300px] text-sm text-muted-foreground">
                Exclusive posts, live sessions and 1:1 chats, all in one place.
              </p>
            </div>

            <ul className="mt-6 grid grid-cols-3 gap-2">
              {PERKS.map(({ Icon, label }) => (
                <li
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted/60 px-2 py-3 text-center text-[11px] font-semibold leading-tight"
                >
                  <Icon className="size-4 text-purple-500" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={busy}
              className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card active:scale-[0.99] disabled:opacity-60 dark:border-transparent"
            >
              {busy ? <Loader2 className="size-5 animate-spin" /> : <GoogleLogo className="size-5" />}
              {busy ? 'Signing you in…' : 'Continue with Google'}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" aria-hidden />
              No passwords. New here? We&apos;ll create your account.
            </p>

            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              By continuing, you agree to Zexy&apos;s{' '}
              <a href="https://zexy.live/terms-of-service" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                Terms
              </a>{' '}
              and{' '}
              <a href="https://zexy.live/privacy-policy" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-foreground">
                Privacy Policy
              </a>
              .
            </p>
          </>
        ) : (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            <div className="mb-2 text-center">
              <span className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                Almost there
              </span>
              <h2 className="mt-3 text-xl font-black tracking-tight">Complete your profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">So creators know who they&apos;re talking to.</p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cp-name" className={labelCls}>
                Full Name <span className="text-purple-500">*</span>
              </label>
              <div className="relative">
                <UserIcon className={iconCls} />
                <Input
                  id="cp-name"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(clean.name(e.target.value))}
                  autoComplete="name"
                  maxLength={50}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cp-mobile" className={labelCls}>
                Mobile Number <span className="text-purple-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center rounded-full border border-input bg-muted px-4 text-sm font-semibold text-muted-foreground">
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
                  className="h-12 flex-1 bg-muted/40 text-base tracking-wider focus-visible:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cp-city" className={labelCls}>
                City <span className="text-purple-500">*</span>
              </label>
              <div className="relative">
                <MapPin className={iconCls} />
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
              <label htmlFor="cp-dob" className={labelCls}>
                Date of Birth <span className="text-purple-500">*</span>
              </label>
              <div className="relative">
                <Calendar className={iconCls} />
                <Input
                  id="cp-dob"
                  type="date"
                  value={dob}
                  min={dobLimits.min}
                  max={dobLimits.max}
                  onChange={(e) => setDob(e.target.value)}
                  className={cn(inputCls, 'block w-full')}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className={labelCls}>
                Gender <span className="text-purple-500">*</span>
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
                      'flex h-11 items-center justify-center gap-1.5 rounded-full border text-xs font-semibold transition',
                      gender === item.id
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 ring-1 ring-purple-500 dark:text-purple-300'
                        : 'border-input bg-muted/40 text-foreground/80 hover:bg-muted'
                    )}
                  >
                    <item.Icon className="size-4" aria-hidden />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className={primaryBtn}
              disabled={busy || !name.trim() || mobile.length < 10 || !city.trim() || !dob.trim() || !gender}
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" /> Saving…
                </>
              ) : (
                'Start exploring'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export interface SignupModalProps {
  open: boolean;
  onClose: () => void;
  initialView?: ModalView;
  redirectOnSuccess?: string;
}

export function SignupModal({ open, onClose, initialView, redirectOnSuccess }: SignupModalProps) {
  if (!open || typeof document === 'undefined') return null;
  // Portal to <body>: a parent with backdrop-filter/transform (e.g. the sticky header)
  // would otherwise trap this fixed backdrop inside itself and outside clicks would miss it.
  return createPortal(
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <div className="w-full max-w-[420px]" onClick={(e) => e.stopPropagation()}>
        <SignupPanel initialView={initialView} redirectOnSuccess={redirectOnSuccess} onClose={onClose} />
      </div>
    </div>,
    document.body
  );
}
