'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { isAxiosError } from 'axios';
import { CheckCircle2, Loader2, Pencil, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useFanCommonProfile,
  useUpdateFanCommonProfile,
  useRequestMobileChange,
  useVerifyMobileChange,
  useSendCurrentMobileOtp,
  useVerifyCurrentMobileOtp,
} from '@/hooks/useFanCommonProfile';
import { normalizeToIndianMobileTen } from '@/lib/indianMobile';
import { OtpVerificationModal } from '@/components/profile/otp-verification-modal';
import { cn, getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

const nativeControlClass = cn(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  'disabled:cursor-not-allowed disabled:opacity-50'
);

function dateOfBirthInputValue(raw: string | null | undefined): string {
  if (!raw) return '';
  const head = raw.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(head) ? head : '';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_AVATAR_BYTES) {
      reject(new Error('Image must be 3 MB or smaller.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: { message?: string } } | undefined;
    return data?.error?.message || data?.message || err.message || fallback;
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export default function EditProfilePage() {
  const { push } = useRouter();
  const { data: profile, isLoading, isError, error, refetch } = useFanCommonProfile();
  const updateProfile = useUpdateFanCommonProfile();
  const sendCurrentMobileOtp = useSendCurrentMobileOtp();
  const verifyCurrentMobileOtp = useVerifyCurrentMobileOtp();
  const requestMobileChange = useRequestMobileChange();
  const verifyMobileChange = useVerifyMobileChange();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [verifiedMobile, setVerifiedMobile] = useState<string | null>(null);

  // 2-step mobile change states
  const [isChangingMobile, setIsChangingMobile] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [isCurrentMobileVerifiedByOtp, setIsCurrentMobileVerifiedByOtp] = useState(false);
  const [otpStep, setOtpStep] = useState<'existing' | 'new'>('existing');
  const [verificationSource, setVerificationSource] = useState<'inline' | 'save'>('inline');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);

  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  /** Value sent on save: server path, `https://…`, or `data:image/…` after gallery pick. */
  const [avatarValue, setAvatarValue] = useState<string | null>(null);

  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name ?? '');
    setUsername((profile.username ?? '').replace(/^@+/, ''));
    setDateOfBirth(dateOfBirthInputValue(profile.date_of_birth));
    setGender(profile.gender ?? '');
    setCity(profile.city ?? '');
    setState(profile.state ?? '');
    setCountry(profile.country ?? '');
    setAvatarValue(profile.avatar);
  }, [profile]);

  const initialMobileClean =
    normalizeToIndianMobileTen(profile?.mobile) ?? (profile?.mobile ?? '').replace(/\D/g, '').slice(-10);
  const currentActiveMobile = verifiedMobile || initialMobileClean;
  const cleanNewMobile = newMobile.replace(/\D/g, '').slice(0, 10);
  const isNewMobileValid = MOBILE_REGEX.test(cleanNewMobile);

  useEffect(() => {
    if (!avatarMenuOpen) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const node = avatarMenuRef.current;
      if (node && !node.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [avatarMenuOpen]);

  const displayAvatarSrc =
    avatarValue?.startsWith('data:') ? avatarValue : avatarValue ? getMediaUrl(avatarValue) || '' : '';

  const initials = (name.trim()[0] || username.trim()[0] || 'F').toUpperCase();

  const handlePickGallery = () => {
    setAvatarMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setAvatarValue(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not use that image.');
    }
  };

  // STEP 1: Initiate verification of existing mobile number
  const handleInitiateExistingMobileVerification = async () => {
    if (!initialMobileClean) {
      setIsCurrentMobileVerifiedByOtp(true);
      setIsChangingMobile(true);
      return;
    }
    setOtpStep('existing');
    setOtpError(null);
    try {
      const res = await sendCurrentMobileOtp.mutateAsync({ mobile: initialMobileClean });
      toast.success(res.message || 'OTP sent to your current mobile number');
      setOtpModalOpen(true);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to send OTP to current mobile');
      toast.error(msg);
    }
  };

  // STEP 1: Verify OTP for existing mobile number
  const handleVerifyExistingOtp = async (otpCode: string) => {
    setOtpError(null);
    try {
      await verifyCurrentMobileOtp.mutateAsync({
        mobile: initialMobileClean,
        otp: otpCode,
      });
      setIsCurrentMobileVerifiedByOtp(true);
      setIsChangingMobile(true);
      setNewMobile('');
      setOtpModalOpen(false);
      toast.success('Current number verified! Enter your new mobile number.');
    } catch (err) {
      const msg = getErrorMessage(err, 'Invalid OTP');
      setOtpError(msg);
      throw err;
    }
  };

  // STEP 2: Initiate verification of new mobile number
  const handleInitiateNewMobileVerification = async (source: 'inline' | 'save') => {
    if (!isCurrentMobileVerifiedByOtp && initialMobileClean) {
      toast.info('Please verify your current mobile number first.');
      await handleInitiateExistingMobileVerification();
      return;
    }

    if (!isNewMobileValid) {
      toast.error('Please enter a valid 10-digit Indian mobile number starting with 6-9');
      return;
    }

    if (cleanNewMobile === initialMobileClean) {
      toast.error('New mobile number must be different from current mobile number');
      return;
    }

    setOtpStep('new');
    setVerificationSource(source);
    setOtpError(null);
    try {
      const res = await requestMobileChange.mutateAsync({ new_mobile: cleanNewMobile });
      toast.success(res.message || 'OTP sent to your new mobile number');
      setOtpModalOpen(true);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to send OTP to new mobile');
      toast.error(msg);
    }
  };

  // STEP 2: Verify OTP for new mobile number
  const handleVerifyNewOtp = async (otpCode: string) => {
    setOtpError(null);
    try {
      const res = await verifyMobileChange.mutateAsync({
        new_mobile: cleanNewMobile,
        otp: otpCode,
      });
      setVerifiedMobile(cleanNewMobile);
      setIsChangingMobile(false);
      setNewMobile('');
      setOtpModalOpen(false);
      toast.success(res.message || 'Mobile number updated successfully!');

      if (verificationSource === 'save') {
        await saveProfileDetails(cleanNewMobile);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Invalid OTP');
      setOtpError(msg);
      throw err;
    }
  };

  // Resend OTP for either Step 1 or Step 2
  const handleResendOtp = async () => {
    setOtpError(null);
    try {
      if (otpStep === 'existing') {
        const res = await sendCurrentMobileOtp.mutateAsync({ mobile: initialMobileClean });
        toast.success(res.message || 'OTP resent to current mobile number');
      } else {
        if (!isNewMobileValid) return;
        const res = await requestMobileChange.mutateAsync({ new_mobile: cleanNewMobile });
        toast.success(res.message || 'OTP resent to new mobile number');
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to resend OTP');
      setOtpError(msg);
      toast.error(msg);
    }
  };

  const saveProfileDetails = async (targetMobile: string) => {
    const trimmedName = name.trim();
    const trimmedUser = username.trim().replace(/^@/, '');
    try {
      await updateProfile.mutateAsync({
        name: trimmedName,
        username: trimmedUser,
        mobile: targetMobile,
        avatar: avatarValue?.trim() || null,
        date_of_birth: dateOfBirth.trim() || null,
        gender: gender.trim() || null,
        country: country.trim() || null,
        state: state.trim() || null,
        city: city.trim() || null,
      });
      toast.success('Profile updated.');
      push('/profile');
    } catch (err) {
      const msg = getErrorMessage(err, 'Update failed.');
      toast.error(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedUser = username.trim().replace(/^@/, '');
    const activeMobile = verifiedMobile || initialMobileClean;

    if (!trimmedName || !trimmedUser || !activeMobile) {
      toast.error('Name, username, and mobile are required.');
      return;
    }

    if (isChangingMobile) {
      if (!cleanNewMobile) {
        toast.error('Please enter a valid 10-digit new mobile number.');
        return;
      }
      if (!isNewMobileValid) {
        toast.error('Please enter a valid 10-digit Indian mobile number starting with 6-9');
        return;
      }
      if (cleanNewMobile === initialMobileClean) {
        toast.error('New mobile number must be different from current mobile number');
        return;
      }
      await handleInitiateNewMobileVerification('save');
      return;
    }

    await saveProfileDetails(activeMobile);
  };

  return (
    <div className="-mt-2 space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
          <span className="text-sm text-muted-foreground">Loading…</span>
        </div>
      ) : isError ? (
        <div className="py-8 text-center">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Could not load profile.'}
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void refetch()}>
            Try again
          </Button>
        </div>
      ) : profile ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="relative" ref={avatarMenuRef}>
                <button
                  type="button"
                  onClick={() => setAvatarMenuOpen((v) => !v)}
                  className="relative size-28 shrink-0 rounded-full bg-muted ring-offset-background transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-haspopup="menu"
                  aria-expanded={avatarMenuOpen}
                  aria-label="Change profile photo"
                >
                  <span className="absolute inset-0 overflow-hidden rounded-full">
                    {displayAvatarSrc ? (
                      <Image
                        src={displayAvatarSrc}
                        alt="Profile photo"
                        fill
                        sizes="112px"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-lg font-semibold text-muted-foreground">
                        {initials}
                      </span>
                    )}
                  </span>
                  <span
                    className="pointer-events-none absolute bottom-0 right-0 z-10 flex size-9 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-md"
                    aria-hidden
                  >
                    <Pencil className="size-4" />
                  </span>
                </button>
                {avatarMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute left-1/2 top-[calc(100%+0.5rem)] z-20 min-w-[12rem] -translate-x-1/2 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
                      onClick={handlePickGallery}
                    >
                      Choose from gallery
                    </button>
                  </div>
                ) : null}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  tabIndex={-1}
                  aria-hidden
                  onChange={(e) => void handleFileChange(e)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-username" className="text-sm font-medium">
                Username
              </label>
              <div className="relative">
                <span
                  className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 select-none text-sm text-muted-foreground"
                  aria-hidden
                >
                  @
                </span>
                <Input
                  id="edit-username"
                  className="pl-8"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/^@+/, ''))}
                  autoComplete="username"
                  placeholder="username"
                  required
                />
              </div>
            </div>

            {/* MOBILE NUMBER SECTION - 2-STEP VERIFICATION */}
            {!isChangingMobile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="edit-mobile" className="text-sm font-medium">
                    Mobile Number
                  </label>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="size-3 text-emerald-400" />
                    Verified
                  </span>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none"
                      aria-hidden
                    >
                      +91
                    </span>
                    <Input
                      id="edit-mobile"
                      type="tel"
                      value={currentActiveMobile}
                      readOnly
                      className="pl-12 bg-zinc-900/50 text-zinc-300 cursor-not-allowed border-zinc-800 focus-visible:ring-0"
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={() => void handleInitiateExistingMobileVerification()}
                    disabled={sendCurrentMobileOtp.isPending}
                    className="shrink-0 h-10 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium shadow"
                  >
                    {sendCurrentMobileOtp.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      'Change'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-zinc-500">
                  To change your mobile number, verify your current number via OTP first.
                </p>
              </div>
            ) : (
              <div className="space-y-3 p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Change Mobile Number
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="size-3 text-emerald-400" />
                    Current verified
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="new-mobile" className="text-xs font-medium text-zinc-300">
                    Enter New Mobile Number
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none"
                        aria-hidden
                      >
                        +91
                      </span>
                      <Input
                        id="new-mobile"
                        type="tel"
                        inputMode="numeric"
                        className="pl-12"
                        value={newMobile}
                        onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        autoComplete="tel"
                        placeholder="10-digit new mobile"
                        maxLength={10}
                        autoFocus
                        required
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => void handleInitiateNewMobileVerification('inline')}
                      disabled={
                        requestMobileChange.isPending ||
                        !isNewMobileValid ||
                        cleanNewMobile === initialMobileClean
                      }
                      className="shrink-0 h-10 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium shadow"
                    >
                      {requestMobileChange.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck className="size-4 mr-1.5" />
                          Verify
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {cleanNewMobile.length > 0 && !isNewMobileValid ? (
                  <p className="text-xs text-amber-400">
                    Please enter a valid 10-digit Indian mobile number starting with 6-9
                  </p>
                ) : cleanNewMobile === initialMobileClean ? (
                  <p className="text-xs text-amber-400">
                    New mobile number must be different from current mobile number
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400">
                    An OTP will be sent to verify your new mobile number.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="edit-dob" className="text-sm font-medium">
                Date of birth
              </label>
              <Input
                id="edit-dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                autoComplete="bday"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-gender" className="text-sm font-medium">
                Gender
              </label>
              <select
                id="edit-gender"
                className={nativeControlClass}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-country" className="text-sm font-medium">
                Country
              </label>
              <Input
                id="edit-country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete="country-name"
                placeholder="Select Country"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-state" className="text-sm font-medium">
                State
              </label>
              <Input
                id="edit-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                autoComplete="address-level1"
                placeholder="Select State"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-city" className="text-sm font-medium">
                City
              </label>
              <Input
                id="edit-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                placeholder="Select City"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={updateProfile.isPending}
                className="inline-flex w-full items-center justify-center gap-2"
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </div>
        </form>
      ) : null}

      {profile ? (
        <OtpVerificationModal
          open={otpModalOpen}
          onClose={() => {
            setOtpModalOpen(false);
            setOtpError(null);
          }}
          title={otpStep === 'existing' ? 'Verify Current Mobile' : 'Verify New Mobile'}
          subtitle={
            otpStep === 'existing'
              ? 'Enter the 4-digit code sent to your current number'
              : 'Enter the 4-digit code sent to your new number'
          }
          mobile={otpStep === 'existing' ? initialMobileClean : cleanNewMobile}
          onVerify={otpStep === 'existing' ? handleVerifyExistingOtp : handleVerifyNewOtp}
          onResend={handleResendOtp}
          isLoading={
            otpStep === 'existing'
              ? verifyCurrentMobileOtp.isPending
              : verifyMobileChange.isPending
          }
          isResending={
            otpStep === 'existing'
              ? sendCurrentMobileOtp.isPending
              : requestMobileChange.isPending
          }
          error={otpError}
        />
      ) : null}
    </div>
  );
}
