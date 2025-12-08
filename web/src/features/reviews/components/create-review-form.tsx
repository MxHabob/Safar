"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { createReviewApiV1ReviewsPost } from "@/generated/actions/reviews";
import { useRouter } from "next/navigation";

const createReviewSchema = z.object({
  listing_id: z.number(),
  rating: z.number().min(1).max(5),
  title: z.string().min(1, "Title is required").max(100),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(1000),
});

type CreateReviewFormData = z.infer<typeof createReviewSchema>;

interface CreateReviewFormProps {
  listingId: number;
  bookingId?: number;
  onSuccess?: () => void;
}

export function CreateReviewForm({ listingId, bookingId, onSuccess }: CreateReviewFormProps) {
  const router = useRouter();
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateReviewFormData>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: {
      listing_id: listingId,
      rating: 0,
      title: "",
      comment: "",
    },
  });

  const currentRating = watch("rating");

  const { execute: createReview } = useAction(createReviewApiV1ReviewsPost, {
    onSuccess: () => {
      toast.success("Review submitted successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    },
    onError: ({ error }) => {
      toast.error(error.message || "Failed to submit review");
    },
  });

  const onSubmit = (data: CreateReviewFormData) => {
    createReview({
      body: {
        listing_id: listingId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        booking_id: bookingId,
      },
    });
  };

  const handleRatingClick = (rating: number) => {
    setValue("rating", rating, { shouldValidate: true });
  };

  return (
    <Card className="rounded-[18px] border border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-light">Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => {
                const rating = i + 1;
                const isActive = rating <= (hoveredRating || currentRating);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleRatingClick(rating)}
                    onMouseEnter={() => setHoveredRating(rating)}
                    onMouseLeave={() => setHoveredRating(null)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`size-8 transition-colors ${
                        isActive
                          ? "fill-foreground text-foreground"
                          : "fill-foreground/10 text-foreground/20"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            {errors.rating && (
              <p className="text-sm text-destructive">{errors.rating.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Give your review a title"
              className="rounded-[18px]"
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Your Review</Label>
            <Textarea
              id="comment"
              {...register("comment")}
              placeholder="Share your experience..."
              rows={6}
              className="rounded-[18px] resize-none"
            />
            {errors.comment && (
              <p className="text-sm text-destructive">{errors.comment.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || currentRating === 0}
            className="w-full rounded-[18px]"
          >
            <Send className="size-4" />
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

