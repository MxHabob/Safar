import type { Metadata } from "next";
import "./globals.css";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/Shared/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Vercel Analytics
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import { Readex_Pro } from "next/font/google";

const readexPro = Readex_Pro({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const metadata: Metadata = {
  title: {
    template: "%s - Safar",
    default: "Safar - Your Travel Companion",
  },
  description: "Discover amazing places to stay, travel guides, and plan your perfect trip with Safar.",
  keywords: ["travel", "accommodation", "bookings", "travel guides"],
  authors: [{ name: "Safar" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Safar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${readexPro.className} antialiased`}>
        <QueryClientProvider client={queryClient}>
          <NuqsAdapter>
            <ThemeProvider attribute="class">
              <Toaster />
              {children}
            </ThemeProvider>
          </NuqsAdapter>
        </QueryClientProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
