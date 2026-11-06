'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/hooks/useAuth';
import { Header } from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';

// Screens guests may browse; their API endpoints are public too.
const GUEST_PATHS = /^\/categories(\/|$)/;

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuthContext();
  const guestAllowed = GUEST_PATHS.test(pathname ?? '');

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !guestAllowed) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, guestAllowed, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full size-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated && !guestAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full size-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-0">
      <Header />
      <main className="container my-5 mx-auto px-4 max-w-4xl">{children}</main>
      <BottomNav />
    </div>
  );
}
