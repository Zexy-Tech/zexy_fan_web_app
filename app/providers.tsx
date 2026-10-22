'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/useAuth';
import { TypographyProvider } from '@/hooks/useTypography';
import { SecurityProvider } from '@/hooks/useSecurity';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import { SecurityShield, Watermark } from '@/components/SecurityShield';
import { MandatoryProfileGuard } from '@/components/auth/mandatory-profile-guard';
import { NotificationPermissionModal } from '@/components/notifications/notification-permission-modal';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TypographyProvider>
          <SecurityProvider>
            <AuthProvider>
              <ThemeProvider>
                <SecurityShield />
                <Watermark />
                <MandatoryProfileGuard>
                  {children}
                </MandatoryProfileGuard>
                <NotificationPermissionModal />
                <Toaster position="top-center" richColors />
              </ThemeProvider>
            </AuthProvider>
          </SecurityProvider>
        </TypographyProvider>
      </QueryClientProvider>
    </Provider>
  );
}
