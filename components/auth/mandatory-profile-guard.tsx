'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, MapPin, Calendar, User as UserIcon, LogOut } from '@/components/ui/icons';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/hooks/useAuth';
import { authService } from '@/services/auth';
import { hasAllMandatoryDetails, saveMockUser, MockRegisteredUser } from '@/lib/mockAuth';
import { toUserCode } from '@/lib/userCode';
import { check, clean, dobBounds } from '@/lib/validation/fields';

type GenderOption = 'male' | 'female' | 'other';

export function MandatoryProfileGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, updateUser, logout } = useAuthContext();

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [city, setCity] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<GenderOption | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const isMissingDetails = isAuthenticated && user && !hasAllMandatoryDetails(user);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMobile(user.mobile ? user.mobile.replace(/\D/g, '').slice(-10) : '');
      setCity(user.city || '');
      setDob(user.date_of_birth || '');
      setGender((user.gender as GenderOption) || '');
    }
  }, [user]);

  const dobLimits = dobBounds();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const firstError =
      check.name(name, 'Full name') ||
      check.mobile(mobile) ||
      check.place(city, 'City') ||
      check.dob(dob) ||
      (gender ? null : 'Please select your gender');
    if (firstError) {
      toast.error(firstError);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await authService.updateProfile({
        name: name.trim(),
        mobile: mobile.trim(),
        city: city.trim(),
        date_of_birth: dob,
        gender,
      });

      updateUser({
        name: updated.name,
        mobile: updated.mobile,
        city: updated.city,
        date_of_birth: updated.date_of_birth,
        gender: updated.gender,
        has_completed_onboarding: true,
        onboarding_step: updated.onboarding_step ?? 5,
      });

      toast.success('Mandatory profile details saved successfully!');
    } catch {
      // Fallback for mock/offline
      const userId = user?.id || Date.now();
      const updatedUser: MockRegisteredUser = {
        id: userId,
        user_code: user?.user_code || toUserCode(userId, user?.role || 'fan'),
        name: name.trim(),
        mobile: mobile.trim(),
        // Random suffix: a fixed "123" collided for every second user with the same name.
        username: user?.username || clean.username(name.replace(/\s+/g, '')).slice(0, 26) + String(Math.floor(100 + Math.random() * 900)),
        avatar: user?.avatar || null,
        role: user?.role || 'fan',
        has_completed_onboarding: true,
        city: city.trim(),
        date_of_birth: dob,
        gender,
        pin: '1234',
      };

      saveMockUser(updatedUser);
      updateUser({
        name: updatedUser.name,
        mobile: updatedUser.mobile,
        city: updatedUser.city,
        date_of_birth: updatedUser.date_of_birth,
        gender: updatedUser.gender,
        has_completed_onboarding: true,
      });

      toast.success('Mandatory profile details saved successfully!');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {children}

      {isMissingDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg">
          <div className="w-full max-w-[420px]">
            <Card className="border-amber-500/30 bg-zinc-900 text-white shadow-2xl rounded-2xl overflow-hidden relative">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-purple-500 to-amber-500" />
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Profile Details Required</h3>
                    <p className="text-xs text-zinc-400">
                      Please complete all 5 mandatory details to access Home or Profile.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSave} className="space-y-3.5">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Full Name <span className="text-purple-400">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                      <Input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(clean.name(e.target.value))}
                        autoComplete="name"
                        maxLength={50}
                        className="h-10 pl-9 border-zinc-700 bg-zinc-800/60 text-xs focus:border-purple-500 text-white"
                      />
                    </div>
                  </div>

                  {/* Mobile */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Mobile Number <span className="text-purple-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 text-xs font-semibold text-zinc-300">
                        +91
                      </div>
                      <Input
                        type="tel"
                        placeholder="9876543210"
                        value={mobile}
                        onChange={(e) => setMobile(clean.mobile(e.target.value))}
                        inputMode="numeric"
                        autoComplete="tel-national"
                        maxLength={10}
                        className="h-10 flex-1 border-zinc-700 bg-zinc-800/60 text-xs tracking-wider focus:border-purple-500 text-white"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      City <span className="text-purple-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                      <Input
                        type="text"
                        placeholder="e.g. Mumbai, Delhi, Bengaluru"
                        value={city}
                        onChange={(e) => setCity(clean.place(e.target.value))}
                        autoComplete="address-level2"
                        maxLength={50}
                        className="h-10 pl-9 border-zinc-700 bg-zinc-800/60 text-xs focus:border-purple-500 text-white"
                      />
                    </div>
                  </div>

                  {/* DOB */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Date of Birth (DOB) <span className="text-purple-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400 pointer-events-none" />
                      <Input
                        type="date"
                        value={dob}
                        min={dobLimits.min}
                        max={dobLimits.max}
                        onChange={(e) => setDob(e.target.value)}
                        className="h-10 pl-9 border-zinc-700 bg-zinc-800/60 text-xs focus:border-purple-500 text-white block w-full"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Gender <span className="text-purple-400">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { id: 'male', label: 'Male' },
                          { id: 'female', label: 'Female' },
                          { id: 'other', label: 'Other' },
                        ] as const
                      ).map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setGender(item.id)}
                          className={cn(
                            'h-9 rounded-full border border-zinc-700 bg-zinc-800/50 text-xs font-medium',
                            gender === item.id
                              ? 'border-purple-500 bg-purple-600/20 text-purple-300 ring-1 ring-purple-500'
                              : 'text-zinc-300 hover:bg-zinc-800'
                          )}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-full bg-purple-600 font-bold text-white hover:bg-purple-500 mt-2 text-xs"
                    disabled={isSaving || !name.trim() || mobile.length < 10 || !city.trim() || !dob.trim() || !gender}
                  >
                    {isSaving ? 'Saving…' : 'Save & Continue to Zexy'}
                  </Button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={() => logout()}
                      className="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-red-400"
                    >
                      <LogOut className="size-3" /> Log out instead
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
