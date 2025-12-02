import { Suspense } from "react";
import { getListings } from "@/lib/server/queries/listings";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { ListingFilters } from "@/lib/server/queries/listings";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Browse Listings",
  description: "Browse all available listings",
};

type SearchParams = Promise<{
  city?: string;
  country?: string;
  listing_type?: string;
  min_price?: string;
  max_price?: string;
  min_guests?: string;
  page?: string;
}>;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const filters: ListingFilters = {
    city: params.city,
    country: params.country,
    listing_type: params.listing_type as any,
    min_price: params.min_price ? parseFloat(params.min_price) : undefined,
    max_price: params.max_price ? parseFloat(params.max_price) : undefined,
    min_guests: params.min_guests ? parseInt(params.min_guests) : undefined,
    skip: params.page ? (parseInt(params.page) - 1) * 50 : 0,
    limit: 50,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Browse Listings</h1>
      <Suspense fallback={<PageSkeleton />}>
        <ListingsContent filters={filters} />
      </Suspense>
    </div>
  );
}

async function ListingsContent({ filters }: { filters: ListingFilters }) {
  const { items, total } = await getListings(filters);
  return <ListingGrid listings={items} total={total} />;
}

