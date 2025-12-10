import { Suspense } from "react";
import dynamic from "next/dynamic";
import type { Metadata as MetadataType } from "next";
import Footer from "@/components/footer";
import { MinimalHero } from "@/features/home/components/minimal-hero";
import { TravelGuidesViewLoading } from "@/features/home/travel-guides-view";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";
import { getGuidesApiV1TravelGuidesGet } from "@/generated/actions/travelGuides";

// Code splitting: Load components lazily to reduce initial bundle size
// Using dynamic imports with Suspense for better streaming SSR
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
    // Reduce bundle size by loading only when needed
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
    // Reduce bundle size by loading only when needed
    ssr: true,
  }
);

// TravelGuidesView uses Suspense wrapper for streaming SSR
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
  title: "",
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
  // Fetch initial data in parallel for better performance
  const [listingsResult, editorialGuidesResult, curatedListingsResult, travelGuidesResult] = await Promise.allSettled([
    listListingsApiV1ListingsGet({ query: { skip: 0, limit: 10, status: "active" } }),
    getGuidesApiV1TravelGuidesGet({ query: { is_official: true, status: "published", skip: 0, limit: 6, sort_by: "view_count" } }),
    listListingsApiV1ListingsGet({ query: { skip: 0, limit: 6, status: "active" } }),
    getGuidesApiV1TravelGuidesGet({ query: { status: "published", skip: 0, limit: 9, sort_by: "view_count" } }),
  ]);

  // Extract data from results - actions return SafeActionResult, need to check for data property
  const listings = listingsResult.status === "fulfilled" && listingsResult.value.data ? listingsResult.value.data : undefined;
  
  // Helper to extract data from SafeActionResult (similar to resolveActionResult in hooks)
  const extractGuidesData = (result: PromiseSettledResult<any>): any[] | undefined => {
    if (result.status !== "fulfilled") return undefined;
    const value = result.value;
    // Check if it's a SafeActionResult with data property
    if (value && typeof value === 'object' && 'data' in value) {
      const data = value.data;
      if (Array.isArray(data)) {
        return data;
      }
    }
    // If value is already an array (direct return from action)
    if (Array.isArray(value)) {
      return value;
    }
    return undefined;
  };

  const editorialGuides = extractGuidesData(editorialGuidesResult);
  const curatedListings = curatedListingsResult.status === "fulfilled" && curatedListingsResult.value.data ? curatedListingsResult.value.data : undefined;
  const travelGuides = extractGuidesData(travelGuidesResult);

  return (
    <>
      {/* <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      /> */}
      
      <div className="min-h-screen w-full">
        <MinimalHero initialsData={listings} />
        <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-16 lg:py-24 space-y-24 lg:space-y-32">
          {/* Streaming SSR: Each section streams independently */}
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
            <EditorialDestinations initialData={editorialGuides} />
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
            <CuratedListings initialData={curatedListings} />
          </Suspense>
          
          <section className="space-y-12">
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl lg:text-4xl font-light tracking-tight">
                Travel Stories
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            {/* Streaming SSR: Travel guides load independently */}
            <Suspense fallback={<TravelGuidesViewLoading />}>
              <TravelGuidesView initialData={travelGuides} />
            </Suspense>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default page;

