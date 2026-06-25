import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Provider } from 'react-redux';

import { registerAuthInterceptors } from '@/src/api/auth-interceptors';
import { AuthBootstrap } from '@/components/AuthBootstrap';
import { AppDialogProvider } from '@/components/app-dialog/AppDialogProvider';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { SocketProvider } from '@/hooks/useSocket';
import { store } from '../store';

registerAuthInterceptors();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <SocketProvider>
            <ToastProvider>
              <AppDialogProvider>{children}</AppDialogProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthBootstrap>
      </QueryClientProvider>
    </Provider>
  );
}
