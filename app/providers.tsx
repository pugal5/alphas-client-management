'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { useRealTimeUpdates } from '@/hooks/useRealTime';

function RealTimeProvider({ children }: { children: React.ReactNode }) {
  useRealTimeUpdates();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <RealTimeProvider>
          {children}
          <Toaster />
        </RealTimeProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

