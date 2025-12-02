import { Suspense } from "react";
import { getMyListings } from "@/lib/server/queries/listings";
import { MyListingsList } from "@/components/listings/MyListingsList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "My Listings",
  description: "Manage your listings",
};

export default async function HostListingsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Listings</h1>
      <Suspense fallback={<PageSkeleton />}>
        <HostListingsContent />
      </Suspense>
    </div>
  );
}

async function HostListingsContent() {
  const listings = await getMyListings();
  return <MyListingsList listings={listings} />;
}

