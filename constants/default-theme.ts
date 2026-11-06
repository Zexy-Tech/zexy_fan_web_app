/**
 * Default Theme Configuration
 * 
 * Provides default theme that matches existing dark theme styling.
 */

import { ThemeConfig } from '@/types/creator-profile';

/**
 * Default theme configuration
 * Matches existing Zexy dark theme
 */
export const DEFAULT_THEME: ThemeConfig = {
  primaryColor: '#ffffff',
  secondaryColor: '#3f3f46',
  gradientStart: '#9333ea', // Purple
  gradientEnd: '#ec4899',   // Pink
  fontFamily: 'Inter',
  borderRadius: 'md',
  buttonStyle: 'solid',
};

/**
 * Preset themes for quick customization
 */
export const PRESET_THEMES: Record<string, ThemeConfig> = {
  default: DEFAULT_THEME,
  
  sunset: {
    primaryColor: '#f59e0b',
    secondaryColor: '#ef4444',
    gradientStart: '#f59e0b',
    gradientEnd: '#ef4444',
    fontFamily: 'Inter',
    borderRadius: 'lg',
    buttonStyle: 'solid',
  },
  
  ocean: {
    primaryColor: '#06b6d4',
    secondaryColor: '#3b82f6',
    gradientStart: '#06b6d4',
    gradientEnd: '#3b82f6',
    fontFamily: 'Inter',
    borderRadius: 'md',
    buttonStyle: 'outline',
  },
  
  forest: {
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    gradientStart: '#10b981',
    gradientEnd: '#059669',
    fontFamily: 'Inter',
    borderRadius: 'xl',
    buttonStyle: 'solid',
  },
  
  lavender: {
    primaryColor: '#8b5cf6',
    secondaryColor: '#a78bfa',
    gradientStart: '#8b5cf6',
    gradientEnd: '#a78bfa',
    fontFamily: 'Inter',
    borderRadius: 'lg',
    buttonStyle: 'ghost',
  },
};
