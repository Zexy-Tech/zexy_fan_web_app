/**
 * Bottom Navigation
 * 
 * Fixed bottom navigation bar for mobile profiles.
 */

'use client';

import { NavItem } from '@/types/creator-profile';
import { Home, MessageCircle, Lock, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/hooks/useAuth';

interface BottomNavigationProps {
  items: NavItem[];
}

/**
 * Get icon component by name
 */
function getNavIcon(iconName: string) {
  const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    Home,
    MessageCircle,
    Lock,
    User,
  };
  
  return icons[iconName] || Home;
}

/**
 * Bottom navigation component
 * 
 * @param items - Array of navigation items
 */
export function BottomNavigation({ items }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated } = useAuthContext();
  
  const handleNavigate = (item: NavItem) => {
    // Check authentication for protected routes
    if (item.requiresAuth && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    router.push(item.route);
  };
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {items.map((item) => {
          const Icon = getNavIcon(item.icon);
          const isActive = pathname === item.route || pathname.startsWith(item.route);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <div
                className="size-6"
                style={{
                  color: isActive ? 'var(--profile-primary)' : undefined,
                }}
              >
                <Icon className="h-full w-full" />
              </div>
              <span
                className="text-xs font-medium"
                style={{
                  color: isActive ? 'var(--profile-primary)' : undefined,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
