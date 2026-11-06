'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';
import { settingsService } from '@/services/settings';
import { useAuthContext } from '@/hooks/useAuth';

function ThemeBackendSync() {
  const { setTheme } = useNextTheme();
  const { isAuthenticated } = useAuthContext();
  const initialSyncRef = React.useRef(false);

  React.useEffect(() => {
    if (!isAuthenticated || initialSyncRef.current) return;
    initialSyncRef.current = true;

    settingsService
      .getSettings()
      .then((settings) => {
        if (settings?.theme && ['light', 'dark', 'system'].includes(settings.theme)) {
          const localTheme = localStorage.getItem('zexy_theme');
          if (!localTheme) {
            setTheme(settings.theme);
          }
        }
      })
      .catch(() => {
        // Gracefully ignore API failures
      });
  }, [isAuthenticated, setTheme]);

  return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="zexy_theme"
      {...props}
    >
      <ThemeBackendSync />
      {children}
    </NextThemesProvider>
  );
}
