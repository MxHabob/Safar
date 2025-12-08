"use client";

import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageCircle, CheckCircle2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import {
  getListingReviewsApiV1ReviewsListingsListingIdGet,
  createReviewResponseApiV1ReviewsReviewIdResponsePost,
} from "@/generated/actions/reviews";
import type { ReviewResponse, ListingResponse } from "@/generated/schemas";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDate } from "@/lib/utils/date";

interface HostReviewsProps {
  listings: ListingResponse[];
}

export function HostReviews({ listings }: HostReviewsProps) {
  const [selectedListing, setSelectedListing] = useState<ListingResponse | null>(
    listings.length > 0 ? listings[0] : null
  );
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState("");

  const { execute: createResponse } = useAction(
    createReviewResponseApiV1ReviewsReviewIdResponsePost,
    {
      onSuccess: () => {
        toast.success("Response posted successfully!");
        setRespondingTo(null);
        setResponseText("");
        if (selectedListing?.id && typeof selectedListing.id === 'number') {
          loadReviews(selectedListing.id);
        }
      },
      onError: (error) => {
        toast.error(error.error?.serverError || "Failed to post response.");
      },
    }
  );

  const loadReviews = useCallback(async (listingId: string) => {
    setLoading(true);
    try {
      const result = await getListingReviewsApiV1ReviewsListingsListingIdGet({
        path: { listing_id: listingId },
      });
      const reviewsData = result?.data || { items: [] };
      setReviews(reviewsData.items || []);
    } catch (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRespond = useCallback((reviewId: string) => {
    if (responseText.trim()) {
      createResponse({
        params: { path: { review_id: reviewId } },
        body: { comment: responseText },
      });
    }
  }, [responseText, createResponse]);

  const handleListingSelect = useCallback((listing: ListingResponse) => {
    setSelectedListing(listing);
    if (listing.id && typeof listing.id === 'number') {
      loadReviews(listing.id);
    }
  }, [loadReviews]);

  // Load reviews when listing changes
  useEffect(() => {
    if (selectedListing?.id && typeof selectedListing.id === 'number') {
      loadReviews(selectedListing.id);
    }
  }, [selectedListing?.id, loadReviews]);

  const getReviewId = useCallback((review: ReviewResponse): number => {
    return typeof review.id === 'string' ? parseInt(review.id) : review.id;
  }, []);

  return (
    <div className="space-y-6">
      {/* Listing Selector */}
      <Card className="rounded-[18px] border">
        <CardHeader>
          <CardTitle className="text-lg font-light">Select Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {listings.map((listing) => (
              <Button
                key={listing.id}
                variant={selectedListing?.id === listing.id ? "default" : "outline"}
                className="rounded-[18px]"
                onClick={() => handleListingSelect(listing)}
              >
                {listing.title}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      {selectedListing && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-light">
              Reviews for {selectedListing.title}
            </h2>
            <Badge variant="secondary" className="rounded-[18px]">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="rounded-[18px] border">
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <Card className="rounded-[18px] border">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground font-light">
                  No reviews yet for this listing
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <Card key={review.id} className="rounded-[18px] border">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="size-12">
                        <AvatarImage src="/avatar.jpg" />
                        <AvatarFallback>G</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">Guest</p>
                        <p className="text-sm text-muted-foreground">
                          {review.created_at
                            ? formatDate(review.created_at, "MMM d, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`size-5 ${
                              i < (review.overall_rating || 0)
                                ? "fill-primary text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">{review.title}</h3>
                      <p className="text-muted-foreground font-light leading-relaxed">
                        {review.comment}
                      </p>
                    </div>

                    {review.response ? (
                      <Card className="rounded-[18px] border bg-muted/30">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="size-4 text-muted-foreground" />
                            <span className="font-medium">Your Response</span>
                            <CheckCircle2 className="size-4 text-green-600 ml-auto" />
                          </div>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {review.response.comment || review.response.response_text || ""}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-2">
                        {respondingTo === getReviewId(review) ? (
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Write your response..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              className="rounded-[18px] min-h-[100px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleRespond(review.id)}
                                className="rounded-[18px]"
                                size="sm"
                              >
                                Post Response
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRespondingTo(null);
                                  setResponseText("");
                                }}
                                className="rounded-[18px]"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setRespondingTo(getReviewId(review))}
                            className="rounded-[18px]"
                            size="sm"
                          >
                            <MessageCircle className="size-4 mr-2" />
                            Respond to Review
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HostReviewsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full rounded-[18px]" />
      <Skeleton className="h-64 w-full rounded-[18px]" />
    </div>
  );
}

