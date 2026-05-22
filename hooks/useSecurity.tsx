'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface SecurityContextType {
  watermarkEnabled: boolean;
  setWatermarkEnabled: (enabled: boolean) => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [watermarkEnabled, setWatermarkEnabledState] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('zexy_watermark_enabled');
    if (saved !== null) {
      setWatermarkEnabledState(saved === 'true');
    }
  }, []);

  const setWatermarkEnabled = (enabled: boolean) => {
    setWatermarkEnabledState(enabled);
    localStorage.setItem('zexy_watermark_enabled', String(enabled));
  };

  return (
    <SecurityContext.Provider value={{ watermarkEnabled, setWatermarkEnabled }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
}
