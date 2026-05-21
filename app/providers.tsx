'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/hooks/useAuth';
import { TypographyProvider } from '@/hooks/useTypography';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TypographyProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </TypographyProvider>
      </QueryClientProvider>
    </Provider>
  );
}
