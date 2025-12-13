import { Suspense } from "react";
import { Metadata } from "next";
import { DiscoverView } from "@/features/discover/discover-view";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";

export const metadata: Metadata = {
  title: "Discover",
  description: "Discover amazing travel destinations on an interactive map. Explore places, find inspiration, and plan your next adventure.",
  keywords: ["discover", "map", "travel destinations", "interactive", "explore"],
  openGraph: {
    title: "Discover - Safar",
    description: "Discover amazing travel destinations on an interactive map",
    type: "website",
    siteName: "Safar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Discover - Safar",
    description: "Discover amazing travel destinations on an interactive map",
  },
  alternates: {
    canonical: "/discover",
  },
};

export const revalidate = 60; // ISR: Revalidate every 60 seconds

const page = async () => {
  // Fetch initial data for faster initial load
  let initialData;
  try {
    const listingsResult = await listListingsApiV1ListingsGet({ 
      query: { skip: 0, limit: 100, status: "active" } 
    });
    initialData = listingsResult?.data;
  } catch (error) {
    // Log error but don't block page render - component handles empty state
    console.error("[Discover Page] Failed to fetch initial listings:", error);
    initialData = undefined;
  }

  return (
    <div className="w-full h-[calc(100vh-1.5rem)]">
      <Suspense fallback={<div className="w-full h-full rounded-xl bg-muted animate-pulse" />}>
        <DiscoverView initialData={initialData} />
      </Suspense>
    </div>
  );
};

export default page;

