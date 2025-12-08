"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { AuthProvider } from "@/lib/auth/client";
import { Toaster } from "@/components/ui/sonner";
import { PWAProvider } from "@/components/pwa";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Performance optimizations
            staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh longer
            gcTime: 10 * 60 * 1000, // 10 minutes - cache persists longer (React Query v5)
            refetchOnWindowFocus: false, // Don't refetch on window focus for better UX
            refetchOnMount: false, // Use cached data if available
            refetchOnReconnect: true, // Refetch on reconnect for fresh data
            retry: 1, // Only retry once for faster error handling
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
          },
          mutations: {
            retry: 1,
            retryDelay: 1000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <ThemeProvider attribute="class">
          <AuthProvider>
            <PWAProvider>
              <Toaster />
              {children}
            </PWAProvider>
          </AuthProvider>
        </ThemeProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  );
};
