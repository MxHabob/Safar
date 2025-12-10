import { Suspense } from "react";
import { Metadata } from "next";
import { HostReviews, HostReviewsLoading } from "@/features/host/components/host-reviews";
import { listListingsApiV1ListingsGet } from "@/generated/actions/listings";
import { getCurrentUser } from "@/lib/auth/server/session";

export const metadata: Metadata = {
  title: "Reviews - Host Dashboard",
  description: "Manage and respond to reviews for your listings",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 60;

async function ReviewsData() {
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return null;
  }

  try {
    const listingsResult = await listListingsApiV1ListingsGet({
      query: {},
    }).catch(() => ({ data: { items: [] } }));

    const allListings = listingsResult?.data?.items || [];
    const listings = allListings.filter((listing: any) => 
      listing.host_id === user.id || listing.host?.id === user.id
    );

    return <HostReviews listings={listings} />;
  } catch (error) {
    return <HostReviews listings={[]} />;
  }
}

export default function ReviewsPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Reviews</h1>
          <p className="text-muted-foreground font-light">
            Manage and respond to reviews for your listings
          </p>
        </div>
        <Suspense fallback={<HostReviewsLoading />}>
          <ReviewsData />
        </Suspense>
      </div>
    </div>
  );
}

