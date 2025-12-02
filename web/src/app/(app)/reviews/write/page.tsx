import { WriteReviewForm } from "@/components/reviews/WriteReviewForm";

export const metadata = {
  title: "Write Review",
  description: "Write a review",
};

type SearchParams = Promise<{ listing_id?: string; booking_id?: string }>;

export default async function WriteReviewPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Write Review</h1>
      <WriteReviewForm listingId={params.listing_id} bookingId={params.booking_id} />
    </div>
  );
}

