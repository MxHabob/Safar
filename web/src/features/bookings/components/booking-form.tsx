"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Simple date formatter
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};
import { useAuth } from "@/lib/auth/client";
import { useRouter } from "next/navigation";
import { createBookingApiV1BookingsPost } from "@/generated/actions/bookings";
import { toast } from "sonner";
import { CouponInput } from "@/features/promotions/components/coupon-input";
import { AvailablePromotions } from "@/features/promotions/components/available-promotions";
import type { ListingResponse } from "@/generated/schemas";

interface BookingFormProps {
  listing: ListingResponse;
  checkIn?: Date;
  checkOut?: Date;
  guests?: number;
}

const bookingFormSchema = z.object({
  check_in: z.date({
    error: "Check-in date is required",
  }),
  check_out: z.date({
    error: "Check-out date is required",
  }),
  guests: z.number().min(1, "At least 1 guest is required"),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export function BookingForm({ listing, checkIn, checkOut, guests: initialGuests }: BookingFormProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      check_in: checkIn || undefined,
      check_out: checkOut || undefined,
      guests: initialGuests || 1,
    },
  });

  const checkInDate = form.watch("check_in");
  const checkOutDate = form.watch("check_out");
  const guests = form.watch("guests");

  // Calculate nights
  const nights = checkInDate && checkOutDate
    ? Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Calculate total price
  const basePrice = listing.base_price || 0;
  const serviceFee = (basePrice as number) * 0.12; // 12% service fee
  const cleaningFee = (basePrice as number) * 0.05; // 5% cleaning fee
  const subtotal = (basePrice as number) * nights;
  const couponDiscount = appliedCoupon?.discountAmount || 0;
  const total = subtotal + serviceFee + cleaningFee - couponDiscount;

  const onSubmit = async (values: BookingFormValues) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/listings/${listing.id}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createBookingApiV1BookingsPost({
        listing_id: listing.id,
        check_in: values.check_in.toISOString().split("T")[0],
        check_out: values.check_out.toISOString().split("T")[0],
        guests: values.guests,
      });

      if (result.data) {
        toast.success("Booking created successfully!");
        // Redirect to payment page
        router.push(`/payments/${result.data.id}`);
      } else if (result.serverError) {
        toast.error(result.serverError as string);
      }
    } catch (error) {
      toast.error("Failed to create booking. Please try again.");
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="sticky top-24 rounded-[18px] border">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Price per night */}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-light">
                {listing.currency} {basePrice}
              </span>
              <span className="text-muted-foreground font-light">per night</span>
            </div>

            {/* Date Picker */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="check_in"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-light">Check-in</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-[18px]",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Select date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="check_out"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm font-light">Check-out</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal rounded-[18px]",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Select date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            date < new Date() || 
                            (checkInDate && date <= checkInDate)
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Guests */}
            <FormField
              control={form.control}
              name="guests"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-light">Guests</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min={1}
                        max={listing.max_guests || 10}
                        className="pl-10 rounded-[18px]"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Coupon Input */}
            {nights > 0 && checkInDate && checkOutDate && (
              <div className="pt-4 border-t">
                <CouponInput
                  listingId={listing.id}
                  bookingAmount={subtotal}
                  checkInDate={checkInDate.toISOString().split("T")[0]}
                  checkOutDate={checkOutDate.toISOString().split("T")[0]}
                  nights={nights}
                  guests={guests}
                  currency={listing.currency}
                  onCouponApplied={(code, discountAmount) => {
                    setAppliedCoupon({ code, discountAmount });
                  }}
                  onCouponRemoved={() => {
                    setAppliedCoupon(null);
                  }}
                  appliedCoupon={appliedCoupon}
                />
              </div>
            )}

            {/* Available Promotions */}
            {nights > 0 && checkInDate && checkOutDate && !appliedCoupon && (
              <div className="pt-4 border-t">
                <AvailablePromotions
                  listingId={listing.id}
                  checkInDate={checkInDate.toISOString().split("T")[0]}
                  nights={nights}
                  guests={guests}
                />
              </div>
            )}

            {/* Price Breakdown */}
            {nights > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-light">
                    {listing.currency} {basePrice} × {nights} {nights === 1 ? "night" : "nights"}
                  </span>
                  <span className="font-light">{listing.currency} {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-light">Service fee</span>
                  <span className="font-light">{listing.currency} {serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-light">Cleaning fee</span>
                  <span className="font-light">{listing.currency} {cleaningFee.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span className="font-light">Coupon discount ({appliedCoupon.code})</span>
                    <span className="font-light">
                      -{listing.currency} {appliedCoupon.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t font-light">
                  <span>Total</span>
                  <span className="text-lg">{listing.currency} {Math.max(0, total).toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full rounded-[18px] font-light"
              disabled={isSubmitting || !checkInDate || !checkOutDate}
            >
              {isSubmitting ? (
                "Processing..."
              ) : isAuthenticated ? (
                "Reserve"
              ) : (
                "Sign in to book"
              )}
            </Button>

            {!isAuthenticated && (
              <p className="text-xs text-center text-muted-foreground font-light">
                You'll be redirected to sign in
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

