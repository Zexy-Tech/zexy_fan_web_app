'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/useAuth';
import { TypographyProvider } from '@/hooks/useTypography';
import { SecurityProvider } from '@/hooks/useSecurity';
import { Toaster } from 'sonner';
import { SecurityShield, Watermark } from '@/components/SecurityShield';

import { MandatoryProfileGuard } from '@/components/auth/mandatory-profile-guard';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TypographyProvider>
          <SecurityProvider>
            <AuthProvider>
              <SecurityShield />
              <Watermark />
              <MandatoryProfileGuard>
                {children}
              </MandatoryProfileGuard>
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </SecurityProvider>
        </TypographyProvider>
      </QueryClientProvider>
    </Provider>
  );
}
