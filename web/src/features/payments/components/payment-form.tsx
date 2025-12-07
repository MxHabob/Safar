"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
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

interface PaymentFormProps {
  booking: BookingResponse;
  onSuccess?: (paymentId: string) => void;
  onCancel?: () => void;
}

const paymentFormSchema = z.object({
  payment_method: PaymentMethodTypeSchema,
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function PaymentForm({ booking, onSuccess, onCancel }: PaymentFormProps) {
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      setClientSecret(data.client_secret);
    },
    onError: (error) => {
      toast.error(`Failed to initialize payment: ${error.message}`);
    },
    showToast: false,
  });

  // Process payment mutation
  const processPaymentMutation = useProcessPaymentApiV1PaymentsProcessPostMutation({
    onSuccess: (data) => {
      toast.success("Payment processed successfully!");
      onSuccess?.(data.id);
    },
    onError: (error) => {
      toast.error(`Payment failed: ${error.message}`);
      setIsProcessing(false);
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
    if (!paymentIntentId || !booking?.id) {
      toast.error("Payment intent not initialized. Please try again.");
      return;
    }

    setIsProcessing(true);

    try {
      await processPaymentMutation.mutateAsync({
        booking_id: booking.id,
        payment_intent_id: paymentIntentId,
        payment_method: values.payment_method,
      });
    } catch (error) {
      // Error is handled by onError callback
      console.error("Payment processing error:", error);
    }
  };

  const isLoading = createIntentMutation.isPending || !paymentIntentId;
  const canSubmit = !isLoading && !isProcessing && paymentIntentId && clientSecret;

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
                    disabled={isLoading || isProcessing}
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

            {/* Payment Method Specific Fields */}
            {(paymentMethod === "stripe" || paymentMethod === "credit_card" || paymentMethod === "debit_card") && clientSecret && (
              <div className="space-y-4 p-4 border rounded-[18px]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-light">
                  <Lock className="size-4" />
                  <span>Secure payment powered by Stripe</span>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-light">
                    Stripe integration will be handled by Stripe Elements. 
                    Client secret: {clientSecret.substring(0, 20)}...
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {paymentMethod === "paypal" && (
              <div className="space-y-4 p-4 border rounded-[18px]">
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-light">
                  <Lock className="size-4" />
                  <span>You will be redirected to PayPal</span>
                </div>
              </div>
            )}

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
                  Failed to initialize payment. Please try again.
                </AlertDescription>
              </Alert>
            )}

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
                disabled={!canSubmit || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isLoading ? (
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

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-light pt-2">
              <Lock className="size-3" />
              <span>Your payment information is encrypted and secure</span>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

