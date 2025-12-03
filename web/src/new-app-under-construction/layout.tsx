import type { Metadata } from "next";
import "./globals.css";

// Vercel Analytics
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

import { Readex_Pro } from "next/font/google";
import { Providers } from "@/lib/providers";

const readexPro = Readex_Pro({
  subsets: ["latin"],
  display: "swap",
  preload: true,
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
        <Providers>
          {children}
        </Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
