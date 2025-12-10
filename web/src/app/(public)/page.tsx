import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { Metadata as MetadataType } from "next";
import Footer from "@/components/footer";
import { MinimalHero } from "@/features/home/components/minimal-hero";
import { TravelGuidesViewLoading } from "@/features/home/travel-guides-view";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";

const EditorialDestinations = dynamic(
  () =>
    import("@/features/home/components/editorial-destinations").then(
      (mod) => mod.EditorialDestinations
    ),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded-md animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 rounded-[18px] bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    ),
    ssr: true,
  }
);

const CuratedListings = dynamic(
  () =>
    import("@/features/home/components/curated-listings").then(
      (mod) => mod.CuratedListings
    ),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted rounded-md animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-80 rounded-[18px] bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    ),
    ssr: true,
  }
);

const TravelGuidesView = dynamic(
  () =>
    import("@/features/home/travel-guides-view").then(
      (mod) => mod.TravelGuidesView
    ),
  {
    ssr: true,
  }
);

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

export const revalidate = 60;

const page = async () => {

  const listingsResult = await listListingsApiV1ListingsGet({ 
    query: { skip: 0, limit: 10, status: "active" } 
  }).catch(() => null);

  const listings = listingsResult?.data || undefined;

  return (
    <>
      {/* <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      /> */}
      
      <div className="min-h-screen w-full">
        <MinimalHero initialsData={listings} />
        <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-16 lg:py-24 space-y-24 lg:space-y-32">
          <Suspense fallback={
            <div className="space-y-6">
              <div className="h-8 w-64 bg-muted rounded-md animate-pulse" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-72 rounded-[18px] bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          }>
            <EditorialDestinations />
          </Suspense>
          
          <Suspense fallback={
            <div className="space-y-6">
              <div className="h-8 w-64 bg-muted rounded-md animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-80 rounded-[18px] bg-muted animate-pulse" />
                ))}
              </div>
            </div>
          }>
            <CuratedListings />
          </Suspense>
          
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
        <Footer />
      </div>
    </>
  );
};

export default page;

