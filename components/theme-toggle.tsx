'use client';

import * as React from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('shrink-0 text-muted-foreground', className)}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="size-5" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleTheme}
      className={cn('shrink-0 text-muted-foreground hover:text-foreground', className)}
      aria-label={`Current theme: ${theme}. Click to switch theme`}
      title={`Theme: ${theme} (click to toggle)`}
    >
      {theme === 'system' ? (
        <Laptop className="size-5" />
      ) : resolvedTheme === 'dark' ? (
        <Moon className="size-5" />
      ) : (
        <Sun className="size-5" />
      )}
    </Button>
  );
}

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
      className={cn('grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg border border-border/50', className)}
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
              'flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-all',
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
