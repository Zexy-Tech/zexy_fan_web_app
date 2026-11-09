'use client';

import { url } from '@/lib/validation/fields';
import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, Instagram, Twitter, Facebook } from '@/components/ui/icons';
import { useAuthContext } from '@/hooks/useAuth';
import { hasAllMandatoryDetails } from '@/lib/mockAuth';
import { SignupPanel } from '@/components/auth/signup-modal';

const SOCIALS = [
  { href: 'https://instagram.com/zexy.live', label: 'Instagram', Icon: Instagram },
  { href: 'https://twitter.com/zexylive', label: 'Twitter', Icon: Twitter },
  { href: 'https://facebook.com/zexylive', label: 'Facebook', Icon: Facebook },
] as const;

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = url.internalPath(searchParams.get('next')) || '/creators'; // blocks //evil, /\\evil, https://

  const { isAuthenticated, user, isLoading } = useAuthContext();

  // Already signed in with all details -> straight to the target
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && hasAllMandatoryDetails(user)) {
      router.push(nextUrl);
    }
  }, [isAuthenticated, user, isLoading, router, nextUrl]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground">
      {/* Ambient brand glow: soft in light mode, deeper in dark */}
      <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-purple-500/15 blur-[120px] dark:bg-purple-600/20" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 -right-32 size-[460px] rounded-full bg-pink-500/10 blur-[120px] dark:bg-fuchsia-600/15" />

      <main className="relative z-10 w-full max-w-[420px] space-y-6">
        <SignupPanel redirectOnSuccess={nextUrl} />

        <div className="text-center">
          <Link
            href="/creators"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-purple-500"
          >
            Just browsing? Explore creators <ArrowRight className="size-3" aria-hidden />
          </Link>
        </div>
      </main>

      <footer className="relative z-10 mt-10 flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          {SOCIALS.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition hover:border-purple-500/40 hover:bg-purple-500/5 hover:text-purple-500"
            >
              <Icon className="size-4" />
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">
          <a href="https://zexy.live/privacy-policy" className="hover:text-foreground">
            Privacy
          </a>
          <span className="size-1 rounded-full bg-border" />
          <a href="https://zexy.live/terms-of-service" className="hover:text-foreground">
            Terms
          </a>
          <span className="size-1 rounded-full bg-border" />
          <span>© 2026 Zexy</span>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
