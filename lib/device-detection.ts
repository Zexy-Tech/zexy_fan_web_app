/**
 * Device Detection Utilities
 * 
 * Provides server-side and client-side device detection based on User-Agent
 * and screen dimensions. Used to enforce mobile-only access to creator profiles.
 */

export interface DeviceDetectionResult {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
}

/**
 * Detect device type from User-Agent string
 * 
 * @param userAgent - HTTP User-Agent header value
 * @returns DeviceDetectionResult with exactly one device type set to true
 * 
 * @example
 * const result = detectDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0...')
 * // { isMobile: true, isTablet: false, isDesktop: false, userAgent: '...' }
 */
export function detectDevice(userAgent: string): DeviceDetectionResult {
  // Mobile patterns (excluding tablets)
  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  
  // Tablet patterns
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;
  
  // Check tablet first (more specific)
  const isTablet = tabletRegex.test(userAgent);
  
  // Check mobile only if not tablet
  const isMobile = !isTablet && mobileRegex.test(userAgent);
  
  // Desktop is anything that's not mobile or tablet
  const isDesktop = !isMobile && !isTablet;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    userAgent,
  };
}

/**
 * Client-side device detection based on screen width
 * Use as fallback when User-Agent is not available
 * 
 * @returns DeviceDetectionResult based on window.innerWidth
 */
export function detectDeviceClient(): Omit<DeviceDetectionResult, 'userAgent'> {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true };
  }
  
  const width = window.innerWidth;
  
  // Mobile: < 768px
  // Tablet: 768px - 1024px
  // Desktop: > 1024px
  const isMobile = width < 768;
  const isTablet = width >= 768 && width <= 1024;
  const isDesktop = width > 1024;
  
  return {
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Check if current device should be blocked from accessing mobile-only content
 * 
 * @param deviceInfo - Device detection result
 * @returns true if device should be blocked (desktop)
 */
export function shouldBlockDevice(deviceInfo: DeviceDetectionResult): boolean {
  return deviceInfo.isDesktop;
}
