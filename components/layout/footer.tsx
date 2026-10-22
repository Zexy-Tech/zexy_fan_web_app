'use client';

import Image from 'next/image';
import { useState } from 'react';
import { UserRound } from 'lucide-react';
import { SignupModal } from '@/components/auth/signup-modal';

export function Footer() {
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-border bg-card text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto flex max-w-md flex-col items-center">
            <div className="relative mb-4 flex h-11 w-16 items-center justify-center">
              <div className="absolute left-0 flex size-10 items-center justify-center rounded-full border border-border bg-muted">
                <UserRound className="size-5 text-muted-foreground" />
              </div>
              <div className="absolute left-6 flex size-10 items-center justify-center rounded-full border border-pink-300/50 bg-pink-500 p-1.5 shadow-md shadow-pink-500/20">
                <Image
                  src="/zexy_z_letter_logo_nobg.png"
                  alt="Zexy"
                  width={22}
                  height={22}
                  className="size-5 object-contain"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSignupModalOpen(true)}
              className="mb-2 text-center text-lg leading-tight tracking-tight text-foreground transition-opacity hover:opacity-85"
            >
              Create Your Profile On Zexy
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <a
                href="https://zexy.live/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Privacy Policy
              </a>
              <span>|</span>
              <a
                href="https://zexy.live/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                Terms
              </a>
              <span>|</span>
              <span className="cursor-default">Report</span>
            </div>
          </div>
        </div>

        <div className="h-1 bg-gradient-to-r from-pink-500/40 via-purple-500/40 to-pink-500/40" />
      </footer>

      <SignupModal open={isSignupModalOpen} onClose={() => setIsSignupModalOpen(false)} />
    </>
  );
}
