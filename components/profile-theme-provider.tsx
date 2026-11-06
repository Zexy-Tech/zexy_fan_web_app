/**
 * Profile Theme Provider
 * 
 * Applies creator's custom theme to profile page using CSS custom properties.
 * Automatically cleans up theme on unmount.
 */

'use client';

import { useEffect } from 'react';
import { ThemeConfig } from '@/types/creator-profile';
import { applyThemeToDOM, resetTheme } from '@/lib/theme-utils';

interface ProfileThemeProviderProps {
  theme: ThemeConfig;
  children: React.ReactNode;
}

/**
 * Provider component that applies theme to DOM
 * 
 * @param theme - Theme configuration to apply
 * @param children - Child components to render
 * 
 * @example
 * <ProfileThemeProvider theme={config.theme}>
 *   <ProfileContent />
 * </ProfileThemeProvider>
 */
export function ProfileThemeProvider({ theme, children }: ProfileThemeProviderProps) {
  useEffect(() => {
    // Apply theme on mount and when theme changes
    applyThemeToDOM(theme);
    
    // Cleanup: reset theme on unmount
    return () => {
      resetTheme();
    };
  }, [theme]);
  
  return <>{children}</>;
}
