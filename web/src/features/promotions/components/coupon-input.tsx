"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tag, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useValidateCouponApiV1PromotionsCouponsCouponCodeValidateGet } from "@/generated/hooks/promotions";

interface CouponInputProps {
  listingId: string;
  bookingAmount: number;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guests: number;
  currency?: string;
  onCouponApplied?: (couponCode: string, discountAmount: number) => void;
  onCouponRemoved?: () => void;
  appliedCoupon?: {
    code: string;
    discountAmount: number;
  } | null;
}

const couponSchema = z.object({
  code: z.string().min(1, "Coupon code is required").toUpperCase(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export function CouponInput({
  listingId,
  bookingAmount,
  checkInDate,
  checkOutDate,
  nights,
  guests,
  currency = "USD",
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: CouponInputProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: "",
    },
  });

  // Validate coupon when form is submitted
  const { refetch: validateCoupon } = useValidateCouponApiV1PromotionsCouponsCouponCodeValidateGet(
    form.watch("code") || "",
    listingId,
    bookingAmount,
    checkInDate,
    checkOutDate,
    nights,
    guests,
    {
      enabled: false, // Don't auto-validate, only on submit
    }
  );

  const onSubmit = async (values: CouponFormValues) => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateCoupon();

      if (result.data?.valid) {
        const discountAmount = result.data.discount_amount || 0;
        onCouponApplied?.(values.code, discountAmount);
        form.reset();
        setValidationError(null);
      } else {
        setValidationError(
          result.data?.error || "Invalid coupon code. Please check and try again."
        );
      }
    } catch (error) {
      setValidationError("Failed to validate coupon. Please try again.");
      console.error("Coupon validation error:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemove = () => {
    onCouponRemoved?.();
    form.reset();
    setValidationError(null);
  };

  return (
    <div className="space-y-3">
      {appliedCoupon ? (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-[18px]">
          <div className="flex items-center gap-2">
            <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-sm font-light">
                <span className="font-medium">{appliedCoupon.code}</span> applied
              </div>
              <div className="text-xs text-green-700 dark:text-green-300 font-light">
                {currency} {appliedCoupon.discountAmount.toFixed(2)} discount
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="size-6 rounded-full"
          >
            <X className="size-3" />
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder="Enter coupon code"
                        className="pl-10 pr-20 rounded-[18px] uppercase"
                        disabled={isValidating}
                        onChange={(e) => {
                          field.onChange(e.target.value.toUpperCase());
                          setValidationError(null);
                        }}
                      />
                      <Button
                        type="submit"
                        size="sm"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 text-xs rounded-[18px]"
                        disabled={!field.value || isValidating}
                      >
                        {isValidating ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {validationError && (
              <Alert variant="destructive" className="rounded-[18px]">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm font-light">
                  {validationError}
                </AlertDescription>
              </Alert>
            )}
          </form>
        </Form>
      )}
    </div>
  );
}

