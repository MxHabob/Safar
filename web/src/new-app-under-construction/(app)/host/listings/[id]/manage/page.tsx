import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/server/queries/listings";
import { ListingManageView } from "@/components/listings/ListingManageView";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ id: string }>;

export default async function ManageListingPage({ params }: { params: Params }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ManageListingContent id={id} />
    </Suspense>
  );
}

async function ManageListingContent({ id }: { id: string }) {
  const listing = await getListing(id);
  
  if (!listing) {
    notFound();
  }
  
  return <ListingManageView listing={listing} />;
}

