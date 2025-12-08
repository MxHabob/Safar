import { Suspense } from "react";
import { Metadata } from "next";
import { SearchResultsView, SearchResultsLoading } from "@/features/search/search-results-view";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for accommodations, destinations, and travel guides on Safar.",
  keywords: ["search", "accommodation", "destinations", "travel"],
  openGraph: {
    title: "Search - Safar",
    description: "Search for accommodations and destinations",
    type: "website",
    siteName: "Safar",
  },
  alternates: {
    canonical: "/search",
  },
};

/**
 * Search results page
 * Displays search results for listings and destinations
 */
export default function SearchPage() {
  return (
    <div className="min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Suspense fallback={<SearchResultsLoading />}>
          <SearchResultsView />
        </Suspense>
      </main>
    </div>
  );
}

