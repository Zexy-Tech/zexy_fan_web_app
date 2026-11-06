/**
 * Validation utilities for Creator Profile Configuration
 */

import { CreatorProfileConfig, ThemeConfig, ValidationResult } from '@/types/creator-profile';

/**
 * Validate hex color format
 * 
 * @param color - Color string to validate
 * @returns true if valid hex color (#RGB or #RRGGBB)
 */
export function isValidHexColor(color: string): boolean {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
}

/**
 * Validate theme configuration
 * 
 * @param theme - Theme configuration object
 * @returns ValidationResult with errors if invalid
 */
export function validateThemeConfig(theme: ThemeConfig): ValidationResult {
  const errors: string[] = [];
  
  // Validate primary color
  if (!isValidHexColor(theme.primaryColor)) {
    errors.push('Primary color must be valid hex format (#RGB or #RRGGBB)');
  }
  
  // Validate secondary color
  if (!isValidHexColor(theme.secondaryColor)) {
    errors.push('Secondary color must be valid hex format (#RGB or #RRGGBB)');
  }
  
  // Validate gradient colors
  if (!isValidHexColor(theme.gradientStart)) {
    errors.push('Gradient start color must be valid hex format');
  }
  
  if (!isValidHexColor(theme.gradientEnd)) {
    errors.push('Gradient end color must be valid hex format');
  }
  
  // Validate font family (non-empty string)
  if (!theme.fontFamily || theme.fontFamily.trim().length === 0) {
    errors.push('Font family must be non-empty string');
  }
  
  // Validate border radius
  const validBorderRadius = ['sm', 'md', 'lg', 'xl'];
  if (!validBorderRadius.includes(theme.borderRadius)) {
    errors.push(`Border radius must be one of: ${validBorderRadius.join(', ')}`);
  }
  
  // Validate button style
  const validButtonStyles = ['solid', 'outline', 'ghost'];
  if (!validButtonStyles.includes(theme.buttonStyle)) {
    errors.push(`Button style must be one of: ${validButtonStyles.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate complete profile configuration
 * 
 * @param config - Profile configuration object
 * @returns ValidationResult with errors if invalid
 */
export function validateProfileConfig(config: CreatorProfileConfig): ValidationResult {
  const errors: string[] = [];
  
  // Validate creator ID
  if (!config.creatorId || config.creatorId <= 0) {
    errors.push('Creator ID must be positive integer');
  }
  
  // Validate username
  if (!config.username || config.username.trim().length === 0) {
    errors.push('Username must be non-empty string');
  }
  
  // Validate theme
  const themeValidation = validateThemeConfig(config.theme);
  if (!themeValidation.isValid) {
    errors.push(...themeValidation.errors);
  }
  
  // Validate sections
  if (!config.sections || !Array.isArray(config.sections)) {
    errors.push('Sections must be an array');
  } else {
    // Check for unique section IDs
    const sectionIds = new Set<string>();
    for (const section of config.sections) {
      if (!section.id || section.id.trim().length === 0) {
        errors.push('Section ID must be non-empty string');
      } else if (sectionIds.has(section.id)) {
        errors.push(`Duplicate section ID: ${section.id}`);
      } else {
        sectionIds.add(section.id);
      }
      
      // Validate section order
      if (typeof section.order !== 'number' || section.order < 0) {
        errors.push(`Section ${section.id} must have non-negative order`);
      }
    }
    
    // Validate at least one enabled section
    const hasEnabledSection = config.sections.some(s => s.enabled);
    if (!hasEnabledSection) {
      errors.push('At least one section must be enabled');
    }
  }
  
  // Validate action buttons
  if (config.actionButtons && Array.isArray(config.actionButtons)) {
    for (const button of config.actionButtons) {
      if (!button.id || button.id.trim().length === 0) {
        errors.push('Action button ID must be non-empty string');
      }
      
      if (!button.label || button.label.trim().length === 0) {
        errors.push('Action button label must be non-empty string');
      }
      
      const validButtonTypes = ['brand_enquiry', 'chat', 'custom_link', 'email'];
      if (!validButtonTypes.includes(button.type)) {
        errors.push(`Action button type must be one of: ${validButtonTypes.join(', ')}`);
      }
      
      if (!button.action || button.action.trim().length === 0) {
        errors.push('Action button action must be non-empty string');
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get default theme configuration
 * 
 * @returns Default ThemeConfig matching existing dark theme
 */
export function getDefaultTheme(): ThemeConfig {
  return {
    primaryColor: '#ffffff',
    secondaryColor: '#3f3f46',
    gradientStart: '#9333ea',
    gradientEnd: '#ec4899',
    fontFamily: 'Inter',
    borderRadius: 'md',
    buttonStyle: 'solid',
  };
}
