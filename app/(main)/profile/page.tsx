'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuthContext } from '@/hooks/useAuth';
import { useFanCommonProfile } from '@/hooks/useFanCommonProfile';
import { Button } from '@/components/ui/button';
import { Bookmark, Crown, Loader2, PenLine, Settings, Sparkles, Trash2, User } from 'lucide-react';
import { getMediaUrl } from '@/lib/utils';
import { toUserCode } from '@/lib/userCode';

function formatRole(role: string | null | undefined) {
  if (!role) return '—';
  const r = role.toLowerCase();
  if (!r) return '—';
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function RoleBadge({ role }: { role: string | null | undefined }) {
  const Icon = role?.toLowerCase() === 'creator' ? Sparkles : User;
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium capitalize text-foreground">
      <Icon className="size-3 shrink-0 text-foreground" aria-hidden />
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
    <div className="-mx-4 space-y-1 bg-background px-4 pb-10 pt-2 text-foreground sm:-mx-0 sm:rounded-none sm:px-0">
      <div className="pb-1">
        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden />
            <span className="text-sm text-muted-foreground">Loading profile…</span>
          </div>
        ) : isError ? (
          <div className="space-y-3 py-2 text-center">
            <p className="text-sm text-destructive">
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
                <p className="truncate text-lg font-semibold leading-none tracking-tight text-foreground">
                  {profile.name || '—'}
                </p>
                <RoleBadge role={profile.role} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {profile.username ? (
                  <span className="truncate text-sm text-muted-foreground">@{profile.username}</span>
                ) : null}
                <span className="rounded bg-muted/80 px-2 py-0.5 font-mono text-[11px] font-medium text-foreground">
                  {profile.user_code || toUserCode(profile.id, profile.role)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No profile data.</p>
        )}
      </div>

      {!isLoading && !isError && profile ? (
        <div className="relative left-1/2 w-screen -translate-x-1/2 py-2" aria-hidden>
          <div className="h-px w-full bg-border" />
        </div>
      ) : null}

      <Link
        href="/membership"
        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-muted/70"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground">
          <Crown className="size-5 text-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-foreground">My subscription</p>
          <p className="text-sm text-muted-foreground">View all subscriptions</p>
        </div>
      </Link>

      <Link
        href="/profile/saved"
        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-muted/70"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground">
          <Bookmark className="size-5 text-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-foreground">Saved</p>
          <p className="text-sm text-muted-foreground">Images, videos, audio, and products</p>
        </div>
      </Link>

      <Link
        href="/settings"
        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-muted/70"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground">
          <Settings className="size-5 text-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-foreground">Settings</p>
          <p className="text-sm text-muted-foreground">
            Onboarding: {user.has_completed_onboarding ? 'Completed' : 'In progress'}
          </p>
        </div>
      </Link>

      <div>
        <Link
          href="/profile/edit"
          className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-muted/70"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground">
            <PenLine className="size-5 text-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight text-foreground">Edit profile</p>
            <p className="text-sm text-muted-foreground">Name, photo, and account details</p>
          </div>
        </Link>
      </div>

      {profile?.role?.toLowerCase() === 'creator' ? (
        <div className="-mx-1 flex cursor-not-allowed items-center gap-3 rounded-md px-1 py-3 opacity-60">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground">
            <Sparkles className="size-5 text-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight text-foreground">Switch to Creator</p>
            <p className="text-sm text-muted-foreground">Your account is already registered as a creator.</p>
          </div>
        </div>
      ) : (
        <Link
          href="/profile/switch-to-creator"
          className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-muted/70"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground">
            <Sparkles className="size-5 text-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight text-foreground">Switch to Creator</p>
            <p className="text-sm text-muted-foreground">Share content and earn with a creator profile.</p>
          </div>
        </Link>
      )}

      <Link
        href="/profile/delete-account"
        className="-mx-1 flex items-center gap-3 rounded-md px-1 py-3 transition-colors hover:bg-muted/70"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-foreground">
          <Trash2 className="size-5 text-foreground" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-tight text-foreground">Delete account</p>
          <p className="text-sm text-muted-foreground">
            Permanently delete account in 30 days.
          </p>
        </div>
      </Link>
    </div>
  );
}
