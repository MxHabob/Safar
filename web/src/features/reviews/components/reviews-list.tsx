"use client";

import { Star, ThumbsUp, MessageCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
// Simple date formatting utility
const formatDistanceToNow = (date: Date | string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};
import type { ReviewResponse } from "@/generated/schemas";
import { markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost } from "@/generated/actions/reviews";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

interface ReviewsListProps {
  reviews: ReviewResponse[];
  listingId?: string;
}

export function ReviewsList({ reviews, listingId }: ReviewsListProps) {
  const { execute: markHelpful } = useAction(markReviewHelpfulApiV1ReviewsReviewIdHelpfulPost, {
    onSuccess: () => {
      toast.success("Review marked as helpful");
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Failed to mark review as helpful");
    },
  });

  const handleMarkHelpful = (reviewId: string) => {
    markHelpful({
      params: {
        path: {
          review_id: reviewId,
        },
      },
      body: {},
    });
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-light">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card key={review.id} className="rounded-[18px] border border-border">
          <CardContent className="p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className="size-10 rounded-full">
                  <AvatarImage
                    src={review.user?.avatar_url || review.user?.profile_picture}
                    alt={review.user?.first_name || "User"}
                  />
                  <AvatarFallback>
                    {(review.user?.first_name?.[0] || review.user?.email?.[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {review.user?.first_name && review.user?.last_name
                      ? `${review.user.first_name} ${review.user.last_name}`
                      : review.user?.email || "Anonymous"}
                  </div>
                  <div className="text-sm text-muted-foreground font-light">
                    {review.created_at
                      ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true })
                      : "Recently"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < (review.rating || 0)
                        ? "fill-foreground text-foreground"
                        : "fill-foreground/10 text-foreground/20"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Review Content */}
            <div className="space-y-3">
              {review.title && (
                <h3 className="font-medium text-lg">{review.title}</h3>
              )}
              <p className="text-muted-foreground font-light leading-relaxed whitespace-pre-line">
                {review.comment || review.content || "No comment provided."}
              </p>
            </div>

            {/* Host Response */}
            {review.host_response && (
              <div className="pl-4 border-l-2 border-border space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="size-4" />
                  Host Response
                </div>
                <p className="text-muted-foreground font-light text-sm leading-relaxed">
                  {review.host_response}
                </p>
                {review.host_response_date && (
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.host_response_date), { addSuffix: true })}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-[18px]"
                onClick={() => handleMarkHelpful(review.id!)}
              >
                <ThumbsUp className="size-4" />
                <span className="text-sm">Helpful</span>
                {review.helpful_count && review.helpful_count > 0 && (
                  <span className="text-xs text-muted-foreground">({review.helpful_count})</span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReviewsListLoading() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-[18px] border border-border">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Skeleton key={j} className="size-4 rounded" />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

