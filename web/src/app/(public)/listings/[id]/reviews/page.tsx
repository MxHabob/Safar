import { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReviewsView } from "@/features/reviews/reviews-view";
import { ReviewsListLoading } from "@/features/reviews/components/reviews-list";
import { getListingReviewsApiV1ReviewsListingsListingIdGet } from "@/generated/actions/reviews";
import { getListingApiV1ListingsListingIdGet } from "@/generated/actions/listings";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;

  return {
    title: `Reviews - Listing ${id} - Safar`,
    description: "View and read reviews for this listing",
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const revalidate = 60;

export default async function ListingReviewsPage({ params }: { params: Params }) {
  const { id } = await params;
  const listingId = id;

  try {
    const [reviewsResult] = await Promise.all([
      getListingReviewsApiV1ReviewsListingsListingIdGet({
        path: { listing_id: listingId },
      }).catch(() => null),
    ]);

    const reviews = reviewsResult?.data || { items: [], total: 0, skip: 0, limit: 0 };

    return (
      <div className="min-h-screen w-full">
        <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
          <Suspense fallback={<ReviewsListLoading />}>
            <ReviewsView
              reviews={reviews}
              listingId={listingId}
              canReview={false}
            />
          </Suspense>
        </main>
      </div>
    );
  } catch (error) {
    notFound();
  }
}

