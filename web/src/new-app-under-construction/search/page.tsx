import { Suspense } from "react";
import { searchListings } from "@/lib/server/queries/search";
import { SearchResults } from "@/components/search/SearchResults";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type SearchParams = Promise<{
  q?: string;
  city?: string;
  country?: string;
  min_price?: string;
  max_price?: string;
  min_guests?: string;
  page?: string;
}>;

export const metadata = {
  title: "Search",
  description: "Search for listings",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Search Results</h1>
      <Suspense fallback={<PageSkeleton />}>
        <SearchContent searchParams={params} />
      </Suspense>
    </div>
  );
}

async function SearchContent({ searchParams }: { searchParams: Awaited<SearchParams> }) {
  const results = await searchListings({
    query: searchParams.q,
    city: searchParams.city,
    country: searchParams.country,
    min_price: searchParams.min_price ? parseFloat(searchParams.min_price) : undefined,
    max_price: searchParams.max_price ? parseFloat(searchParams.max_price) : undefined,
    min_guests: searchParams.min_guests ? parseInt(searchParams.min_guests) : undefined,
    skip: searchParams.page ? (parseInt(searchParams.page) - 1) * 50 : 0,
    limit: 50,
  });

  return <SearchResults results={results} />;
}

