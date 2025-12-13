import { Suspense } from "react";
import { Metadata } from "next";
import { cache } from "react";
import dynamic from "next/dynamic";
import { getListingApiV1AdminListingsListingIdGet } from "@/generated/actions/admin";
import { Spinner } from "@/components/ui/spinner";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Listing Details",
  description: "View and manage listing details",
};

// Dynamic import for better code splitting
const ListingDetailPage = dynamic(
  () =>
    import("@/features/admin/listings/listing-detail").then((mod) => ({
      default: mod.ListingDetailPage,
    })),
  {
    loading: () => (
      <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
        <Spinner />
      </div>
    ),
    ssr: true,
  }
);

// Cache the data fetching function
const getListingData = cache(async (listingId: string) => {
  try {
    return await getListingApiV1AdminListingsListingIdGet({
      path: { listing_id: listingId },
    });
  } catch {
    return null;
  }
});

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  
  // Fetch listing data on server
  const listingData = await getListingData(id);

  if (!listingData?.data) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="w-full h-full m-auto min-h-[400px] flex items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <ListingDetailPage initialListingData={listingData.data} />
    </Suspense>
  );
}

