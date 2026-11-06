/**
 * Theme Utilities
 * 
 * Functions for applying and managing creator profile themes.
 */

import { ThemeConfig } from '@/types/creator-profile';

/**
 * Get CSS border radius value from size
 * 
 * @param size - Border radius size (sm, md, lg, xl)
 * @returns CSS border radius value
 */
export function getBorderRadiusValue(size: 'sm' | 'md' | 'lg' | 'xl'): string {
  const values = {
    sm: '0.25rem',  // 4px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
  };
  
  return values[size] || values.md;
}

/**
 * Apply theme configuration to DOM
 * 
 * Sets CSS custom properties on document root element.
 * This allows theme colors to be used throughout the profile.
 * 
 * @param theme - Theme configuration object
 * 
 * @example
 * applyThemeToDOM({
 *   primaryColor: '#ec4899',
 *   secondaryColor: '#9333ea',
 *   gradientStart: '#ec4899',
 *   gradientEnd: '#9333ea',
 *   fontFamily: 'Inter',
 *   borderRadius: 'lg',
 *   buttonStyle: 'solid',
 * });
 */
export function applyThemeToDOM(theme: ThemeConfig): void {
  if (typeof document === 'undefined') {
    return; // Server-side, skip
  }
  
  const root = document.documentElement;
  
  // Apply color variables
  root.style.setProperty('--profile-primary', theme.primaryColor);
  root.style.setProperty('--profile-secondary', theme.secondaryColor);
  root.style.setProperty('--profile-gradient-start', theme.gradientStart);
  root.style.setProperty('--profile-gradient-end', theme.gradientEnd);
  
  // Apply font family
  root.style.setProperty('--profile-font-family', theme.fontFamily);
  
  // Apply border radius
  root.style.setProperty('--profile-border-radius', getBorderRadiusValue(theme.borderRadius));
  
  // Store button style for components to use
  root.style.setProperty('--profile-button-style', theme.buttonStyle);
}

/**
 * Reset theme to default
 * 
 * Removes all profile theme CSS custom properties from DOM.
 */
export function resetTheme(): void {
  if (typeof document === 'undefined') {
    return; // Server-side, skip
  }
  
  const root = document.documentElement;
  
  root.style.removeProperty('--profile-primary');
  root.style.removeProperty('--profile-secondary');
  root.style.removeProperty('--profile-gradient-start');
  root.style.removeProperty('--profile-gradient-end');
  root.style.removeProperty('--profile-font-family');
  root.style.removeProperty('--profile-border-radius');
  root.style.removeProperty('--profile-button-style');
}

/**
 * Get theme CSS class names for gradient background
 * 
 * @returns Tailwind CSS class string for gradient
 */
export function getGradientClasses(): string {
  // Since we're using CSS custom properties, we can use them in Tailwind
  return 'bg-gradient-to-br';
}

/**
 * Get inline styles for gradient background
 * 
 * @param theme - Theme configuration
 * @returns React inline style object
 */
export function getGradientStyle(theme: ThemeConfig): React.CSSProperties {
  return {
    backgroundImage: `linear-gradient(to bottom right, ${theme.gradientStart}, ${theme.gradientEnd})`,
  };
}
