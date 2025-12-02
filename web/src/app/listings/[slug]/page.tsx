import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getListingBySlug } from "@/lib/server/queries/listings";
import { ListingDetail } from "@/components/listings/ListingDetail";
import { generateListingMetadata } from "@/lib/utils/seo";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  
  if (!listing) {
    return {
      title: "Listing Not Found",
    };
  }
  
  return generateListingMetadata(listing);
}

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ListingContent slug={slug} />
    </Suspense>
  );
}

async function ListingContent({ slug }: { slug: string }) {
  const listing = await getListingBySlug(slug);
  
  if (!listing) {
    notFound();
  }
  
  return <ListingDetail listing={listing} />;
}

