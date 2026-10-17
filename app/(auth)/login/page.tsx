'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, LogIn, ArrowRight, Instagram, Twitter, Facebook } from 'lucide-react';
import { useAuthContext } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { hasAllMandatoryDetails } from '@/lib/mockAuth';

const SignupModal = dynamic(
  () => import('@/components/auth/signup-modal').then((mod) => mod.SignupModal),
  { ssr: false }
);

function safeInternalPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/')) return null;
  if (raw.startsWith('//')) return null;
  return raw;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = safeInternalPath(searchParams.get('next')) || '/creators';

  const { isAuthenticated, user, isLoading } = useAuthContext();
  const [isPopupOpen, setIsPopupOpen] = useState(true);

  // If already authenticated and completed onboarding, redirect to target
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && hasAllMandatoryDetails(user)) {
      router.push(nextUrl);
    }
  }, [isAuthenticated, user, isLoading, router, nextUrl]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white p-4 font-inter relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] space-y-8 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-4">
          <div className="size-20 flex items-center justify-center mb-1 relative overflow-hidden group">
            <Image
              src="/zexy_z_letter_logo_nobg.png"
              alt="Zexy logo"
              width={70}
              height={70}
              priority
              className="object-contain drop-shadow-[0_0_20px_rgba(140,61,241,0.4)] group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-black tracking-[0.15em] uppercase italic bg-gradient-to-b from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              ZEXY
            </h1>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.5em] pl-[0.5em]">
              Premium Creator Hub
            </p>
          </div>
        </div>

        {/* Center Card */}
        <Card className="border-zinc-800/60 bg-[#121214]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#8c3df1] to-transparent opacity-80" />
          <CardContent className="p-8 text-center space-y-5">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">Access Your Account</h2>
              <p className="text-xs text-zinc-400">
                Log in or sign up to interact with creators, purchase exclusive content, and join live streams.
              </p>
            </div>

            <Button
              type="button"
              onClick={() => setIsPopupOpen(true)}
              className="w-full h-13 py-3.5 bg-gradient-to-r from-[#6b21a8] via-[#7e22ce] to-[#9333ea] hover:opacity-95 text-white font-bold rounded-xl transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-900/30"
            >
              <LogIn className="size-4" />
              <span>Log In / Sign Up</span>
              <ArrowRight className="size-4 ml-1" />
            </Button>

            <div className="pt-2">
              <Link
                href="/creators"
                className="text-xs text-zinc-500 hover:text-purple-400 transition-colors inline-block"
              >
                Browse creators as guest →
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <div className="flex flex-col items-center gap-5 pt-2">
          <div className="flex items-center gap-4 w-full">
            <div className="h-px flex-1 bg-zinc-800/60" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">
              Connect with us
            </span>
            <div className="h-px flex-1 bg-zinc-800/60" />
          </div>

          <div className="flex items-center gap-5">
            <a
              href="https://instagram.com/zexy.live"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="size-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 transition-all hover:bg-[#e789ff]/5"
            >
              <Instagram className="size-4" />
            </a>
            <a
              href="https://twitter.com/zexylive"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="size-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 transition-all hover:bg-[#e789ff]/5"
            >
              <Twitter className="size-4" />
            </a>
            <a
              href="https://facebook.com/zexylive"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="size-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-[#e789ff] hover:border-[#e789ff]/30 transition-all hover:bg-[#e789ff]/5"
            >
              <Facebook className="size-4" />
            </a>
          </div>

          <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-zinc-500 uppercase opacity-60">
            <a href="https://zexy.live/privacy-policy" className="hover:text-zinc-300 transition-colors">
              Privacy
            </a>
            <div className="size-1 rounded-full bg-zinc-800" />
            <a href="https://zexy.live/terms-of-service" className="hover:text-zinc-300 transition-colors">
              Terms
            </a>
            <div className="size-1 rounded-full bg-zinc-800" />
            <span className="cursor-default">© 2026 ZEXY</span>
          </div>
        </div>
      </div>

      {/* The Single Popup for Signup & Login */}
      <SignupModal
        open={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        redirectOnSuccess={nextUrl}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
          <Loader2 className="size-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
