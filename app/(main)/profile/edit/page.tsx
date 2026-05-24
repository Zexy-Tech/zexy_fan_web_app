'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAxiosError } from 'axios';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFanCommonProfile, useUpdateFanCommonProfile } from '@/hooks/useFanCommonProfile';
import { cn, getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';

const MAX_AVATAR_BYTES = 3 * 1024 * 1024;

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

export default function EditProfilePage() {
  const router = useRouter();
  const { data: profile, isLoading, isError, error, refetch } = useFanCommonProfile();
  const updateProfile = useUpdateFanCommonProfile();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
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
    setMobile(profile.mobile ?? '');
    setDateOfBirth(dateOfBirthInputValue(profile.date_of_birth));
    setGender(profile.gender ?? '');
    setCity(profile.city ?? '');
    setState(profile.state ?? '');
    setCountry(profile.country ?? '');
    setAvatarValue(profile.avatar);
  }, [profile]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedUser = username.trim().replace(/^@/, '');
    const trimmedMobile = mobile.trim();
    if (!trimmedName || !trimmedUser || !trimmedMobile) {
      toast.error('Name, username, and mobile are required.');
      return;
    }
    try {
      await updateProfile.mutateAsync({
        name: trimmedName,
        username: trimmedUser,
        mobile: trimmedMobile,
        avatar: avatarValue?.trim() || null,
        date_of_birth: dateOfBirth.trim() || null,
        gender: gender.trim() || null,
        country: country.trim() || null,
        state: state.trim() || null,
        city: city.trim() || null,
      });
      toast.success('Profile updated.');
      router.push('/profile');
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message ||
          err.response?.statusText ||
          err.message
        : err instanceof Error
          ? err.message
          : 'Update failed.';
      toast.error(msg);
    }
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
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayAvatarSrc}
                        alt=""
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

            <div className="space-y-2">
              <label htmlFor="edit-mobile" className="text-sm font-medium">
                Mobile
              </label>
              <Input
                id="edit-mobile"
                type="tel"
                inputMode="numeric"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
                required
              />
            </div>

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
    </div>
  );
}
