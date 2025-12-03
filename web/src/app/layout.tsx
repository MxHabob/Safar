import type { Metadata } from "next";
import "./globals.css";

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
    default: "Safar - Travel Guides & Stories",
  },
  description: "Discover amazing travel destinations, stories, and guides. Share your travel experiences and explore the world with Safar.",
  keywords: ["travel", "accommodation", "bookings", "travel guides", "travel stories", "destinations", "photography"],
  authors: [{ name: "Safar" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Safar",
    title: "Safar - Travel Guides & Stories",
    description: "Discover amazing travel destinations, stories, and guides. Share your travel experiences and explore the world with Safar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safar - Travel Guides & Stories",
    description: "Discover amazing travel destinations, stories, and guides.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
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
