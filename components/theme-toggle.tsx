'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from '@/components/ui/icons';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

export function ThemeSelectorGroup({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Laptop },
  ] as const;

  if (!mounted) {
    return <div className={cn('h-9 bg-muted rounded-lg', className)} />;
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme mode"
      className={cn('grid grid-cols-3 gap-1 bg-muted p-1 rounded-full border border-border/50', className)}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-full text-xs font-medium',
              isSelected
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="size-3.5" />
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
