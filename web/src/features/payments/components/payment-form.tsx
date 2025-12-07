"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Lock, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatePaymentIntentApiV1PaymentsIntentPostMutation } from "@/generated/hooks/payments";
import { useProcessPaymentApiV1PaymentsProcessPostMutation } from "@/generated/hooks/payments";
import { toast } from "sonner";
import type { BookingResponse, PaymentMethodType } from "@/generated/schemas";
import { PaymentMethodTypeSchema } from "@/generated/schemas";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { StripeProvider } from "@/lib/providers/stripe-provider";

interface PaymentFormProps {
  booking: BookingResponse;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

const paymentFormSchema = z.object({
  payment_method: PaymentMethodTypeSchema,
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

// Stripe Payment Form Component (wrapped with Stripe Elements)
function StripePaymentForm({
  booking,
  paymentIntentId,
  clientSecret,
  onSuccess,
  onCancel,
  paymentMethod,
}: {
  booking: BookingResponse;
  paymentIntentId: string;
  clientSecret: string;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
  paymentMethod: PaymentMethodType;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const processPaymentMutation = useProcessPaymentApiV1PaymentsProcessPostMutation({
    onSuccess: (data) => {
      toast.success("Payment processed successfully!");
      setIsProcessing(false);
      onSuccess?.(data.id);
    },
    onError: (error) => {
      const errorMessage = error.message || "Payment failed. Please try again.";
      toast.error(errorMessage);
      setPaymentError(errorMessage);
      setIsProcessing(false);
    },
    showToast: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !paymentIntentId || !booking?.id) {
      toast.error("Payment system not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Confirm the payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/success`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        // Handle confirmation error
        const errorMessage =
          confirmError.message || "Payment confirmation failed. Please try again.";
        toast.error(errorMessage);
        setPaymentError(errorMessage);
        setIsProcessing(false);
        return;
      }

      // If payment intent is already succeeded, process it
      if (paymentIntent?.status === "succeeded") {
        await processPaymentMutation.mutateAsync({
          booking_id: booking.id,
          payment_intent_id: paymentIntentId,
          payment_method: paymentMethod,
        });
      } else if (paymentIntent?.status === "requires_action") {
        // Payment requires additional action (e.g., 3D Secure)
        // Stripe will handle the redirect automatically
        toast.info("Please complete the additional verification step.");
      } else {
        // Payment is processing or in another state
        await processPaymentMutation.mutateAsync({
          booking_id: booking.id,
          payment_intent_id: paymentIntentId,
          payment_method: paymentMethod,
        });
      }
    } catch (error) {
      console.error("Payment processing error:", error);
      const errorMessage = "An unexpected error occurred. Please try again.";
      toast.error(errorMessage);
      setPaymentError(errorMessage);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe Payment Element */}
      <div className="space-y-4 p-4 border rounded-[18px]">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-light">
          <Lock className="size-4" />
          <span>Secure payment powered by Stripe</span>
        </div>
        <div className="py-2">
          <PaymentElement />
        </div>
        {paymentError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm font-light">{paymentError}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-[18px] font-light"
            disabled={isProcessing}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 rounded-[18px] font-light"
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Lock className="size-4 mr-2" />
              Pay {booking.currency} {booking.total_amount}
            </>
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-light pt-2">
        <Lock className="size-3" />
        <span>Your payment information is encrypted and secure</span>
      </div>
    </form>
  );
}

export function PaymentForm({ booking, onSuccess, onCancel }: PaymentFormProps) {
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      payment_method: "stripe" as PaymentMethodType,
    },
  });

  const paymentMethod = form.watch("payment_method");

  // Create payment intent when component mounts or booking changes
  const createIntentMutation = useCreatePaymentIntentApiV1PaymentsIntentPostMutation({
    onSuccess: (data) => {
      setPaymentIntentId(data.payment_intent_id);
      setClientSecret(data.client_secret || null);
    },
    onError: (error) => {
      // Extract error message - backend returns user-friendly messages
      const errorMessage = error.message || "Failed to initialize payment. Please try again.";
      toast.error(errorMessage);
    },
    showToast: false,
  });


  useEffect(() => {
    if (booking?.id && booking?.total_amount) {
      createIntentMutation.mutate({
        booking_id: booking.id,
        amount: booking.total_amount.toString(),
        currency: booking.currency || "USD",
      });
    }
  }, [booking?.id, booking?.total_amount]);

  const onSubmit = async (values: PaymentFormValues) => {
    // For non-Stripe payment methods, handle them here
    // Stripe payments are handled by StripePaymentForm component
    if (
      values.payment_method !== "stripe" &&
      values.payment_method !== "credit_card" &&
      values.payment_method !== "debit_card"
    ) {
      if (!paymentIntentId || !booking?.id) {
        toast.error("Payment intent not initialized. Please try again.");
        return;
      }

      // Handle other payment methods (PayPal, etc.)
      // This would typically redirect to the payment provider
      toast.info(`Processing ${values.payment_method} payment...`);
    }
  };

  const isLoading = createIntentMutation.isPending || !paymentIntentId;
  // For Stripe payments, clientSecret is required. For other methods, only paymentIntentId is needed
  const requiresClientSecret = paymentMethod === "stripe" || paymentMethod === "credit_card" || paymentMethod === "debit_card";
  const isStripePayment = requiresClientSecret && clientSecret;

  return (
    <Card className="rounded-[18px] border">
      <CardHeader>
        <CardTitle className="text-2xl font-light">Payment</CardTitle>
        <CardDescription className="font-light">
          Complete your booking payment
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Payment Summary */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-[18px]">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-light">Booking Total</span>
                <span className="font-light">
                  {booking.currency} {booking.total_amount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground font-light">Booking ID</span>
                <span className="font-light font-mono text-xs">{booking.id}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-light">Payment Method</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="rounded-[18px]">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="stripe">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>Credit/Debit Card (Stripe)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="credit_card">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>Credit Card</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="debit_card">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>Debit Card</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="paypal">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>PayPal</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="apple_pay">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>Apple Pay</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="google_pay">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>Google Pay</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="fawry">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>Fawry</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="klarna">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>Klarna</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="mpesa">
                        <div className="flex items-center gap-2">
                          <CreditCard className="size-4" />
                          <span>M-Pesa</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="font-light">
                    Choose your preferred payment method
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Loading State */}
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full rounded-[18px]" />
                <Skeleton className="h-10 w-full rounded-[18px]" />
              </div>
            )}

            {/* Error State */}
            {createIntentMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-light">
                  {createIntentMutation.error?.message || "Failed to initialize payment. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            {/* Stripe Payment Form */}
            {isStripePayment && paymentIntentId && clientSecret && (
              <StripeProvider clientSecret={clientSecret}>
                <StripePaymentForm
                  booking={booking}
                  paymentIntentId={paymentIntentId}
                  clientSecret={clientSecret}
                  onSuccess={onSuccess}
                  onCancel={onCancel}
                  paymentMethod={paymentMethod}
                />
              </StripeProvider>
            )}

            {/* Other Payment Methods */}
            {!isStripePayment && paymentMethod === "paypal" && (
              <div className="space-y-4 p-4 border rounded-[18px]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-light">
                  <Lock className="size-4" />
                  <span>You will be redirected to PayPal</span>
                </div>
                <div className="flex gap-3 pt-4">
                  {onCancel && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      className="flex-1 rounded-[18px] font-light"
                    >
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    className="flex-1 rounded-[18px] font-light"
                    disabled={isLoading || !paymentIntentId}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Initializing...
                      </>
                    ) : (
                      <>
                        <Lock className="size-4 mr-2" />
                        Pay {booking.currency} {booking.total_amount}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Security Notice */}
            {!isStripePayment && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-light pt-2">
                <Lock className="size-3" />
                <span>Your payment information is encrypted and secure</span>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

