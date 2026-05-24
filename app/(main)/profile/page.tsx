'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuthContext } from '@/hooks/useAuth';
import { useFanCommonProfile } from '@/hooks/useFanCommonProfile';
import { Button } from '@/components/ui/button';
import { Bookmark, Crown, Loader2, PenLine, Settings, Sparkles, Trash2, User } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils';

function formatRole(role: string | null | undefined) {
  if (!role) return '—';
  const r = role.toLowerCase();
  if (!r) return '—';
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function RoleBadge({ role }: { role: string | null | undefined }) {
  const Icon = role?.toLowerCase() === 'creator' ? Sparkles : User;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/45 bg-transparent px-2.5 py-0.5 text-xs font-medium capitalize text-white">
      <Icon className="size-3 shrink-0 text-white" aria-hidden />
      {formatRole(role)}
    </span>
  );
}

export default function ProfilePage() {
  const { user } = useAuthContext();
  const { data: profile, isLoading, isError, error, refetch } = useFanCommonProfile();

  if (!user) {
    return null;
  }

  return (
    <div className="-mx-4 space-y-1 bg-black px-4 pb-10 pt-2 text-white sm:-mx-0 sm:rounded-none sm:px-0">
      <div className="pb-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="size-8 animate-spin text-white/70" aria-hidden />
            <span className="text-sm text-zinc-400">Loading profile…</span>
          </div>
        ) : isError ? (
          <div className="space-y-3 py-2 text-center">
            <p className="text-sm text-red-400">
              {error instanceof Error ? error.message : 'Could not load profile.'}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              Try again
            </Button>
          </div>
        ) : profile ? (
          <div className="flex items-center gap-4">
            <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-semibold text-white">
              {profile.avatar ? (
                <Image
                  src={getMediaUrl(profile.avatar) || ''}
                  alt={profile.name || profile.username || 'Profile'}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                profile.name?.[0] || profile.username?.[0] || 'F'
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-lg font-semibold leading-none tracking-tight text-white">
                  {profile.name || '—'}
                </p>
                <RoleBadge role={profile.role} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {profile.username ? (
                  <span className="truncate text-sm text-zinc-400">@{profile.username}</span>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-zinc-400">No profile data.</p>
        )}
      </div>

      {!isLoading && !isError && profile ? (
        <div className="relative left-1/2 w-screen -translate-x-1/2 py-2" aria-hidden>
          <div className="h-px w-full bg-white/15" />
        </div>
      ) : null}

      <Link
        href="/membership"
        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-white/10"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
          <Crown className="size-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-white">My subscription</p>
          <p className="text-sm text-zinc-400">View all subscriptions</p>
        </div>
      </Link>

      <Link
        href="/profile/saved"
        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-white/10"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
          <Bookmark className="size-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-white">Saved</p>
          <p className="text-sm text-zinc-400">Images, videos, audio, and products</p>
        </div>
      </Link>

      <Link
        href="/settings"
        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-white/10"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
          <Settings className="size-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-white">Settings</p>
          <p className="text-sm text-zinc-400">
            Onboarding: {user.has_completed_onboarding ? 'Completed' : 'In progress'}
          </p>
        </div>
      </Link>

      <div>
        <Link
          href="/profile/edit"
          className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-white/10"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
            <PenLine className="size-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight text-white">Edit profile</p>
            <p className="text-sm text-zinc-400">Name, photo, and account details</p>
          </div>
        </Link>
      </div>

      {profile?.role?.toLowerCase() === 'creator' ? (
        <div className="-mx-1 flex cursor-not-allowed items-center gap-3 rounded-md px-1 py-3 opacity-60">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
            <Sparkles className="size-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight text-white">Switch to Creator</p>
            <p className="text-sm text-zinc-400">Your account is already registered as a creator.</p>
          </div>
        </div>
      ) : (
        <Link
          href="/profile/switch-to-creator"
          className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-white/10"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
            <Sparkles className="size-5 text-white" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight text-white">Switch to Creator</p>
            <p className="text-sm text-zinc-400">Share content and earn with a creator profile.</p>
          </div>
        </Link>
      )}

      <Link
        href="/profile/delete-account"
        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-white/10"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white">
          <Trash2 className="size-5 text-white" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-white">Delete account</p>
          <p className="text-sm text-zinc-400">
            Permanently remove your account and data. This cannot be undone.
          </p>
        </div>
      </Link>
    </div>
  );
}
