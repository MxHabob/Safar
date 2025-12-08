import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ListingSlider, ListingSliderLoading } from "@/features/listings/listing-slider";
import { ListingDetailView, ListingDetailLoading } from "@/features/listings/listing-detail-view";
import { getListingApiV1ListingsListingIdGet } from "@/generated/actions/listings";
import { ErrorBoundary } from "react-error-boundary";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const result = await getListingApiV1ListingsListingIdGet({
      path: { listing_id: id },
    }).catch(() => null);
    
    const listing = (result as any)?.data || result;
    
    if (!listing || !listing.title) {
      return {
        title: "Listing Not Found",
      };
    }

    return {
      title: `${listing.title} `,
      description: listing.summary || listing.description || `Book ${listing.title} in ${listing.city}, ${listing.country}`,
      keywords: ["listing", "accommodation", listing.city || "", listing.country || "", listing.listing_type || ""],
      openGraph: {
        title: `${listing.title}`,
        description: listing.summary || `Book ${listing.title} in ${listing.city}, ${listing.country}`,
        type: "website",
        siteName: "Safar",
      },
      twitter: {
        card: "summary_large_image",
        title: `${listing.title}`,
        description: listing.summary || `Book ${listing.title}`,
      },
      alternates: {
        canonical: `/listings/${id}`,
      },
    };
  } catch {
    return {
      title: "Listing",
    };
  }
}

export const revalidate = 60; // ISR: Revalidate every 60 seconds

export default async function ListingDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  
  try {
    const listing = await getListingApiV1ListingsListingIdGet({
      path: { listing_id: id },
    });

    if (!listing?.data) {
      notFound();
    }

    return (
      <div className="flex flex-col lg:flex-row min-h-screen w-full">
        <div className="w-full lg:w-1/2 h-[70vh] lg:fixed lg:top-0 lg:left-0 lg:h-screen p-0 lg:p-3 rounded-xl">
          <Suspense fallback={<ListingSliderLoading />}>
            <ErrorBoundary fallback={<p>Something went wrong</p>}>
              <ListingSlider photos={listing.data.images || []} />
            </ErrorBoundary>
          </Suspense>
        </div>
        <div className="hidden lg:block lg:w-1/2" />
        <div className="w-full mt-3 lg:mt-0 lg:w-1/2 space-y-3 pb-3">
          <Suspense fallback={<ListingDetailLoading />}>
            <ErrorBoundary fallback={<p>Something went wrong</p>}>
              <ListingDetailView listing={listing.data} />
            </ErrorBoundary>
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Failed to load listing:', error);
    notFound();
  }
}

