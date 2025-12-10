import { Suspense } from "react";
import { Metadata } from "next";
import type { Metadata as MetadataType } from "next";

import Footer from "@/components/footer";
import { getServerSession } from '@/lib/auth/server/session'
import { MinimalHero } from "@/features/home/components/minimal-hero";
import { EditorialDestinations } from "@/features/home/components/editorial-destinations";
import { CuratedListings } from "@/features/home/components/curated-listings";
import {
  TravelGuidesView,
  TravelGuidesViewLoading,
} from "@/features/home/travel-guides-view";

// Structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Safar",
  description: "The smartest, most distinctive, and seamless travel platform in the world",
  url: "https://safar.com",
  logo: "https://safar.com/logo.png",
  sameAs: [
    "https://instagram.com/safar",
    "https://twitter.com/safar",
  ],
  potentialAction: {
    "@type": "SearchAction",
    target: "https://safar.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export const metadata: MetadataType = {
  title: "Home",
  description: "Discover amazing travel destinations, unique stays, and expert travel guides. Book your next adventure with Safar - the world's smartest travel platform.",
  keywords: ["travel", "accommodation", "bookings", "travel guides", "destinations", "hotels", "vacation rentals", "travel planning"],
  openGraph: {
    title: "Safar - Travel Guides & Stories",
    description: "Welcome to Safar - Discover amazing travel destinations and stories",
    type: "website",
    siteName: "Safar",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safar - Travel Guides & Stories",
    description: "Discover amazing travel destinations and stories",
  },
  alternates: {
    canonical: "/",
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

/**
 * Root page component for Safar travel platform
 * 
 * Performance optimizations:
 * - ISR with 60s revalidation for fresh content
 * - Parallel data fetching with Promise.all
 * - Streaming with Suspense boundaries
 * - Optimized image loading with priority for LCP
 * 
 * Unique, beautiful, and minimal design that stands out:
 * - Editorial-style hero with elegant typography
 * - Asymmetric, magazine-inspired layouts
 * - Creative use of 18px graphic corners
 * - Generous whitespace and refined spacing
 * - Smooth transitions and micro-interactions
 * - Dark-first design with 18px rounded corners
 * - Focus on beauty and simplicity over functionality overload
 */
export const revalidate = 60; // ISR: Revalidate every 60 seconds

const page = async () => {
  // Get session silently - no need to log or await if not critical
  const session = await getServerSession().catch(() => null);

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen w-full">
        {/* MINIMAL HERO SECTION */}
        <MinimalHero />

        {/* MAIN CONTENT - Editorial Layout */}
        <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-16 lg:py-24 space-y-24 lg:space-y-32">
          {/* Editorial Destinations */}
          <EditorialDestinations />

          {/* Curated Listings */}
          <CuratedListings />

          {/* Travel Guides - Minimal Section */}
          <section className="space-y-12">
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl lg:text-4xl font-light tracking-tight">
                Travel Stories
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Suspense fallback={<TravelGuidesViewLoading />}>
              <TravelGuidesView />
            </Suspense>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default page;

