import { Suspense } from "react";
import { getFeaturedListings } from "@/lib/server/queries/listings";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Home",
  description: "Discover amazing places to stay and travel guides",
};

export default async function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Discover Your Next Adventure</h1>
        <p className="text-xl text-muted-foreground">
          Find the perfect place to stay and explore the world
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Featured Listings</h2>
        <Suspense fallback={<PageSkeleton />}>
          <FeaturedListings />
        </Suspense>
      </section>
    </main>
  );
}

async function FeaturedListings() {
  const listings = await getFeaturedListings({ limit: 12 });
  return <ListingGrid listings={listings} />;
}

