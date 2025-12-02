import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/server/queries/listings";
import { ListingManagement } from "@/components/listings/ListingManagement";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ id: string }>;

export default async function HostListingPage({ params }: { params: Params }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HostListingContent id={id} />
    </Suspense>
  );
}

async function HostListingContent({ id }: { id: string }) {
  const listing = await getListing(id);
  
  if (!listing) {
    notFound();
  }
  
  return <ListingManagement listing={listing} />;
}

