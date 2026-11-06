'use client';

import { useTheme as useNextTheme } from 'next-themes';
import { useCallback } from 'react';
import { settingsService } from '@/services/settings';
import { useAuthContext } from '@/hooks/useAuth';

export type ThemeMode = 'light' | 'dark' | 'system';

export function useTheme() {
  const { theme, setTheme: setNextTheme, resolvedTheme, systemTheme } = useNextTheme();
  const { isAuthenticated } = useAuthContext();

  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setNextTheme(newTheme);
      if (isAuthenticated) {
        settingsService.updateSettings({ theme: newTheme }).catch(() => {
          // Gracefully ignore API failures without affecting local state
        });
      }
    },
    [setNextTheme, isAuthenticated]
  );

  return {
    theme: (theme || 'system') as ThemeMode,
    setTheme,
    resolvedTheme: (resolvedTheme || 'dark') as 'light' | 'dark',
    systemTheme: systemTheme as 'light' | 'dark' | undefined,
  };
}
