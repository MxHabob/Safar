"use client";

import { Suspense } from "react";
import { ReviewsList, ReviewsListLoading } from "./components/reviews-list";
import { CreateReviewForm } from "./components/create-review-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Star } from "lucide-react";
import type { ReviewListResponse } from "@/generated/schemas";

interface ReviewsViewProps {
  reviews: ReviewListResponse;
  listingId: number;
  bookingId?: number;
  canReview?: boolean;
}

export function ReviewsView({ reviews, listingId, bookingId, canReview = false }: ReviewsViewProps) {
  const reviewsList = reviews?.items || [];

  return (
    <div className="space-y-8">
      <div className="flex items-baseline gap-4">
        <h2 className="text-3xl lg:text-4xl font-light tracking-tight">Reviews</h2>
        <div className="flex-1 h-px bg-border" />
        <div className="text-muted-foreground font-light">
          {reviewsList.length} {reviewsList.length === 1 ? "review" : "reviews"}
        </div>
      </div>

      <Tabs defaultValue="reviews" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 rounded-[18px]">
          <TabsTrigger value="reviews" className="rounded-[18px]">
            <Star className="size-4" />
            Reviews
          </TabsTrigger>
          {canReview && (
            <TabsTrigger value="write" className="rounded-[18px]">
              <MessageSquare className="size-4" />
              Write Review
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="reviews" className="mt-6">
          <Suspense fallback={<ReviewsListLoading />}>
            <ReviewsList reviews={reviewsList} listingId={listingId} />
          </Suspense>
        </TabsContent>

        {canReview && (
          <TabsContent value="write" className="mt-6">
            <div className="max-w-2xl">
              <CreateReviewForm listingId={listingId} bookingId={bookingId} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

