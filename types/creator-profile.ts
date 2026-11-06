/**
 * Type definitions for Creator Profile Customization System
 */

// ============================================================================
// THEME CONFIGURATION
// ============================================================================

export interface ThemeConfig {
  primaryColor: string; // Hex format, e.g., "#ff0000"
  secondaryColor: string; // Hex format
  gradientStart: string; // Hex format
  gradientEnd: string; // Hex format
  fontFamily: string; // e.g., "Inter", "Roboto"
  borderRadius: 'sm' | 'md' | 'lg' | 'xl';
  buttonStyle: 'solid' | 'outline' | 'ghost';
}

// ============================================================================
// SECTION CONFIGURATIONS
// ============================================================================

export interface IntroConfig {
  greeting: string; // e.g., "Hi, I'm anushka"
  bio: string;
  showAvatar: boolean;
  avatarStyle: 'circle' | 'square' | 'rounded';
}

export interface ActionButton {
  id: string;
  label: string;
  type: 'brand_enquiry' | 'chat' | 'custom_link' | 'email';
  action: string; // URL or action identifier
  icon?: string; // Icon name (lucide-react)
  style: 'primary' | 'secondary' | 'outline';
}

export interface QAItem {
  id: number;
  question: string;
  answer: string;
  createdAt: string;
}

export interface ExclusiveContent {
  id: number;
  title: string;
  isLocked: boolean;
  media_type: 'image' | 'video' | 'audio';
  thumbnail_url?: string | null;
  url?: string | null;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  durationDays: number;
  benefits: string[];
}

// ============================================================================
// PROFILE SECTIONS
// ============================================================================

export type ProfileSectionType = 
  | 'intro' 
  | 'actions' 
  | 'qa' 
  | 'exclusives' 
  | 'subscription' 
  | 'membership'
  | 'products'
  | 'custom';

export interface ProfileSection {
  id: string;
  type: ProfileSectionType;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
}

// ============================================================================
// NAVIGATION
// ============================================================================

export interface NavItem {
  id: string;
  label: string;
  icon: string; // Icon name (lucide-react)
  route: string;
  requiresAuth: boolean;
}

// ============================================================================
// MAIN PROFILE CONFIGURATION
// ============================================================================

export interface CreatorProfileConfig {
  creatorId: number;
  username: string;
  is_live?: boolean;
  active_room_id?: string | null;
  theme: ThemeConfig;
  intro: IntroConfig;
  actionButtons: ActionButton[];
  sections: ProfileSection[];
  bottomNav: NavItem[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

export interface DeviceDetectionConfig {
  blockDesktop: boolean;
  blockTablet: boolean;
  allowedUserAgents: string[];
  blockedUserAgents: string[];
  customBlockMessage: string;
}
