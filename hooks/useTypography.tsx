'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type FontSize = 'compact' | 'standard' | 'large';

interface TypographyContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const TypographyContext = createContext<TypographyContextType | undefined>(undefined);

export function TypographyProvider({ children }: { children: React.ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>('standard');

  useEffect(() => {
    const saved = localStorage.getItem('zexy_font_size') as FontSize;
    if (saved && ['compact', 'standard', 'large'].includes(saved)) {
      setFontSizeState(saved);
      document.documentElement.setAttribute('data-font-size', saved);
    }
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem('zexy_font_size', size);
    document.documentElement.setAttribute('data-font-size', size);
  };

  return (
    <TypographyContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </TypographyContext.Provider>
  );
}

export function useTypography() {
  const context = useContext(TypographyContext);
  if (context === undefined) {
    throw new Error('useTypography must be used within a TypographyProvider');
  }
  return context;
}
