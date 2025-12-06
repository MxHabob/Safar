import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingDetailView, ListingDetailLoading } from "@/pages/listings/listing-detail-view";
import { getListingApiV1ListingsListingIdGet } from "@/generated/actions/listings";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const result = await getListingApiV1ListingsListingIdGet({
      path: { listing_id: id },
    }).catch(() => null);
    
    const listing = (result as any)?.data || result;
    console.log("listing", listing);
    
    if (!listing || !listing.title) {
      return {
        title: "Listing Not Found - Safar",
      };
    }

    return {
      title: `${listing.title} - Safar`,
      description: listing.summary || listing.description || `Book ${listing.title} in ${listing.city}, ${listing.country}`,
      keywords: ["listing", "accommodation", listing.city || "", listing.country || "", listing.listing_type || ""],
      openGraph: {
        title: `${listing.title} - Safar`,
        description: listing.summary || `Book ${listing.title} in ${listing.city}, ${listing.country}`,
        type: "website",
        siteName: "Safar",
      },
      twitter: {
        card: "summary_large_image",
        title: `${listing.title} - Safar`,
        description: listing.summary || `Book ${listing.title}`,
      },
      alternates: {
        canonical: `/listings/${id}`,
      },
    };
  } catch {
    return {
      title: "Listing - Safar",
    };
  }
}

/**
 * Listing detail page
 * Performance: ISR with 60s revalidation for dynamic listing data
 */
export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  return (
    <Suspense fallback={<ListingDetailLoading />}>
      <ListingDetailContent id={id} />
    </Suspense>
  );
}

async function ListingDetailContent({ id }: { id: string }) {
  try {
    const result = await getListingApiV1ListingsListingIdGet({
      path: { listing_id: id },
    }).catch(() => null);

    // Safe actions return { data: ... } structure
    const listing = (result as any)?.data || result;

    if (!listing || !listing.title) {
      notFound();
    }

    return <ListingDetailView listing={listing} />;
  } catch (error) {
    console.error("Error fetching listing:", error);
    notFound();
  }
}

