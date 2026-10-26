'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuthContext, useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, Bell, CreditCard, LogOut, Menu, MessageCircle, User, Users, X, History, Receipt, LayoutGrid, Radio, LogIn } from 'lucide-react';
import { SignupModal } from '@/components/auth/signup-modal';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { ThemeSelectorGroup } from '@/components/theme-toggle';

const navItems = [
  { href: '/creators', label: 'Creators', icon: Users },
  { href: '/categories', label: 'Categories', icon: LayoutGrid },
  { href: '/live', label: 'Live Now', icon: Radio },
  { href: '/subscriptions', label: 'My Creators', icon: CreditCard },
  { href: '/chats', label: 'Chats', icon: MessageCircle },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/activity', label: 'Activity History', icon: History },
  { href: '/billing', label: 'Billing & Invoices', icon: Receipt },
  { href: '/profile', label: 'Profile', icon: User },
];

export function Header() {
  const { user } = useAuthContext();
  const logout = useLogout();
  const pathname = usePathname();
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isMyCreatorsHeader = pathname === '/subscriptions';
  const isMembershipHeader =
    pathname === '/membership' || /^\/subscriptions\/[^/]+$/.test(pathname);
  const isNotificationsHeader = pathname === '/notifications';
  const isSettingsHeader = pathname === '/settings';
  const isEditProfileHeader = pathname === '/profile/edit';
  const isDeleteAccountHeader = pathname === '/profile/delete-account';
  const isSwitchToCreatorHeader = pathname === '/profile/switch-to-creator';
  const isSavedHeader = pathname === '/profile/saved';
  const categorySlugMatch = pathname?.match(/^\/categories\/([^/]+)$/) ?? null;
  const categorySlug = categorySlugMatch?.[1] ?? null;
  const isCategoriesListHeader = pathname === '/categories';
  const isCategoryDetailHeader = Boolean(categorySlug);
  const isCategoriesHeader = isCategoriesListHeader || isCategoryDetailHeader;
  const categoryDetailName = categorySlug
    ? categorySlug
        .split('_')
        .join(' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    : null;
  const isSubscriptionsStyleHeader =
    isMyCreatorsHeader ||
    isMembershipHeader ||
    isNotificationsHeader ||
    isSettingsHeader ||
    isEditProfileHeader ||
    isDeleteAccountHeader ||
    isSwitchToCreatorHeader ||
    isSavedHeader ||
    isCategoriesHeader;
  const subscriptionsStyleTitle = isMyCreatorsHeader
    ? 'My Creators'
    : isMembershipHeader
      ? 'My subscription'
      : isNotificationsHeader
        ? 'Notifications'
      : isSettingsHeader
      ? 'Settings'
      : isEditProfileHeader
        ? 'Edit profile'
        : isDeleteAccountHeader
          ? 'Delete account'
          : isSwitchToCreatorHeader
            ? 'Switch to Creator'
            : isSavedHeader
              ? 'Saved'
              : isCategoriesListHeader
                ? 'Categories'
                : isCategoryDetailHeader
                  ? (categoryDetailName ?? 'Category') : null;
                  
  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto relative flex h-14 items-center justify-between px-4">
          {isSubscriptionsStyleHeader && subscriptionsStyleTitle ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Back"
                onClick={() => router.back()}
                className="shrink-0"
              >
                <ArrowLeft className="size-5" />
              </Button>

              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
                <h1 className="text-sm font-semibold tracking-tight">{subscriptionsStyleTitle}</h1>
              </div>

              <div className="flex items-center gap-1">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  onClick={() => setIsDrawerOpen(true)}
                  className="shrink-0"
                >
                  <Menu className="size-5" />
                </Button>
              </div>
            </>
          ) : (
            <>
              <Link href="/creators" className="flex items-center gap-2">
                <Image
                  src="/zexy_z_letter_logo_nobg.png"
                  alt="Zexy logo"
                  width={28}
                  height={28}
                  priority
                  className="size-7 object-contain"
                />
              </Link>

              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2">
                <h1 className="text-lg font-semibold tracking-[0.2em]">ZEXY</h1>
              </div>

              <div className="flex items-center gap-1">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                  onClick={() => setIsDrawerOpen(true)}
                >
                  <Menu className="size-5" />
                </Button>
              </div>
            </>
          )}
        </div>
      </header>

      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/40',
          isDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside
        className={cn(
          'fixed right-0 top-0 z-[70] h-full w-72 max-w-[85vw] border-l bg-background shadow-xl',
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-hidden={!isDrawerOpen}
      >
        <div className="flex items-center justify-between border-b px-4 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/zexy_z_letter_logo_nobg.png"
              alt="Zexy logo"
              width={24}
              height={24}
              className="size-6 object-contain"
            />
            <span className="text-sm font-semibold tracking-[0.15em]">ZEXY</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close menu"
            onClick={() => setIsDrawerOpen(false)}
          >
            <X className="size-5" />
          </Button>
          </div>

          <nav className="px-2 py-3">          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/subscriptions'
                ? pathname === '/subscriptions'
                : item.href === '/categories'
                  ? pathname === '/categories' || pathname.startsWith('/categories/')
                : item.href === '/profile'
                  ? pathname === '/profile' || pathname.startsWith('/profile/') || pathname === '/settings'
                  : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsDrawerOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm',
                  isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Appearance
          </p>
          <ThemeSelectorGroup />
        </div>

        {user ? (
          <div className="border-t px-2 py-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3"
              onClick={() => {
                logout.mutate();
                setIsDrawerOpen(false);
              }}
              disabled={logout.isPending}
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="border-t px-2 py-3">
            <Button
              className="w-full justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs h-10"
              onClick={() => {
                setIsDrawerOpen(false);
                setIsAuthModalOpen(true);
              }}
            >
              <LogIn className="size-4" />
              Log In / Sign Up
            </Button>
          </div>
        )}
      </aside>

      <SignupModal
        open={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
