import { Suspense } from "react";
import { getMyReviews } from "@/lib/server/queries/reviews";
import { ReviewsList } from "@/components/reviews/ReviewsList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "My Reviews",
  description: "Your reviews",
};

export default async function ReviewsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Reviews</h1>
      <Suspense fallback={<PageSkeleton />}>
        <ReviewsContent />
      </Suspense>
    </div>
  );
}

async function ReviewsContent() {
  const reviews = await getMyReviews();
  return <ReviewsList reviews={reviews} />;
}

