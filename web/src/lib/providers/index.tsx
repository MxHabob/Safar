import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";


const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
  
export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
  <QueryClientProvider client={queryClient}>
    <NuqsAdapter>
      <ThemeProvider attribute="class">
        <Toaster />
        {children}
      </ThemeProvider>
    </NuqsAdapter>
  </QueryClientProvider>
  )
};
