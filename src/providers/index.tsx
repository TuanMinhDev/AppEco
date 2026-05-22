import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Provider } from 'react-redux';

import { AppDialogProvider } from '@/components/app-dialog/AppDialogProvider';
import { ToastProvider } from '@/components/toast/ToastProvider';
import { SocketProvider } from '@/hooks/useSocket';
import { store } from '../store';

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
        <SocketProvider>
          <ToastProvider>
            <AppDialogProvider>
              {children}
            </AppDialogProvider>
          </ToastProvider>
        </SocketProvider>
      </QueryClientProvider>
    </Provider>
  );
}
