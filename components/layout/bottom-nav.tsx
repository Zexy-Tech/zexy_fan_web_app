'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, MessageCircle, CreditCard, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/creators', label: 'Creators', icon: Users },
  { href: '/subscriptions', label: 'My Creators', icon: CreditCard },
  { href: '/chats', label: 'Chats', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === '/creators'
              ? pathname === '/creators' || pathname.startsWith('/creators/')
              : item.href === '/subscriptions'
                ? pathname === '/subscriptions'
                : item.href === '/profile'
                  ? pathname === '/profile' || pathname.startsWith('/profile/') || pathname === '/settings'
                  : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
