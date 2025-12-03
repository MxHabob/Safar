import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/server/queries/listings";
import { EditListingForm } from "@/components/listings/EditListingForm";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ id: string }>;

export default async function EditListingPage({ params }: { params: Params }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EditListingContent id={id} />
    </Suspense>
  );
}

async function EditListingContent({ id }: { id: string }) {
  const listing = await getListing(id);
  
  if (!listing) {
    notFound();
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Edit Listing</h1>
      <EditListingForm listing={listing} />
    </div>
  );
}

