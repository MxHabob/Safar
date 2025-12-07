"use client";

import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { ReactNode, useMemo } from "react";

// Get Stripe publishable key from environment variables
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

// Initialize Stripe
const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null;

interface StripeProviderProps {
  children: ReactNode;
  clientSecret?: string;
  options?: Omit<StripeElementsOptions, "clientSecret">;
}

export function StripeProvider({
  children,
  clientSecret,
  options,
}: StripeProviderProps) {
  // If no Stripe key is configured or no clientSecret, render children without Stripe Elements
  if (!stripePromise || !clientSecret) {
    return <>{children}</>;
  }

  // At this point, TypeScript knows clientSecret is a string
  // When using clientSecret, mode should not be included
  const { mode, ...restOptions } = options || {};
  const elementsOptions: StripeElementsOptions = useMemo(
    () => ({
      clientSecret: clientSecret,
      appearance: {
        theme: "stripe",
        variables: {
          colorPrimary: "hsl(var(--primary))",
          colorBackground: "hsl(var(--background))",
          colorText: "hsl(var(--foreground))",
          colorDanger: "hsl(var(--destructive))",
          fontFamily: "system-ui, sans-serif",
          spacingUnit: "4px",
          borderRadius: "18px",
        },
        rules: {
          ".Input": {
            borderRadius: "18px",
            padding: "12px 16px",
            border: "1px solid hsl(var(--input))",
            backgroundColor: "hsl(var(--background))",
          },
          ".Input:focus": {
            borderColor: "hsl(var(--ring))",
            boxShadow: "0 0 0 2px hsl(var(--ring) / 0.2)",
          },
          ".Label": {
            fontWeight: "400",
            fontSize: "14px",
            marginBottom: "8px",
          },
        },
      },
      locale: "en",
      ...restOptions,
    }),
    [clientSecret, restOptions]
  );

  return (
    <Elements stripe={stripePromise} options={elementsOptions}>
      {children}
    </Elements>
  );
}

