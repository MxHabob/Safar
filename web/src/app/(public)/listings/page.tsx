import { Suspense } from "react";
import { Metadata } from "next";
import { ListingsView, ListingsViewLoading } from "@/features/listings/listings-view";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";

export const metadata: Metadata = {
  title: "Browse Listings",
  description: "Discover unique accommodations and stays around the world. Find the perfect place for your next adventure.",
  keywords: ["listings", "accommodation", "stays", "hotels", "vacation rentals", "bookings"],
  openGraph: {
    title: "Browse Listings - Safar",
    description: "Discover unique accommodations and stays around the world",
    type: "website",
    siteName: "Safar",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Listings - Safar",
    description: "Discover unique accommodations and stays around the world",
  },
  alternates: {
    canonical: "/listings",
  },
};

/**
 * Browse listings page
 * Performance: ISR with 30s revalidation for dynamic listings
 */
export const revalidate = 30; // ISR: Revalidate every 30 seconds

export default async function ListingsPage() {
  // Fetch initial data for faster initial load
  let initialData;
  try {
    const listingsResult = await listListingsApiV1ListingsGet({ 
      query: { skip: 0, limit: 24, status: "active" } 
    });
    initialData = listingsResult?.data;
  } catch (error) {
    // Log error but don't block page render - component handles empty state
    console.error("[Listings Page] Failed to fetch initial listings:", error);
    initialData = undefined;
  }

  return (
    <div className="min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Suspense fallback={<ListingsViewLoading />}>
          <ListingsView initialData={initialData} />
        </Suspense>
      </main>
    </div>
  );
}

