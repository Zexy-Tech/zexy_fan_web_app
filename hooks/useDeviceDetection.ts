/**
 * Client-side device detection hook
 * 
 * Provides reactive device type detection based on window dimensions.
 * Updates on window resize events.
 */

'use client';

import { useState, useEffect } from 'react';

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * Hook for client-side device detection
 * 
 * @returns DeviceInfo object with current device type and screen width
 * 
 * @example
 * const { isMobile, isDesktop } = useDeviceDetection();
 * if (isMobile) {
 *   // Render mobile UI
 * }
 */
export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    if (typeof window === 'undefined') {
      return { isMobile: false, isTablet: false, isDesktop: true, width: 1440 };
    }
    
    const width = window.innerWidth;
    return {
      isMobile: width < 768,
      isTablet: width >= 768 && width <= 1280,
      isDesktop: width > 1280,
      width,
    };
  });
  
  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      setDeviceInfo({
        isMobile: width < 768,
        isTablet: width >= 768 && width <= 1280,
        isDesktop: width > 1280,
        width,
      });
    }
    
    // Add resize listener
    window.addEventListener('resize', handleResize);
    
    // Initial check
    handleResize();
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return deviceInfo;
}
