"use client";

import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { SubscriptionPlanResponse } from "@/generated/schemas";
import { subscribeApiV1SubscriptionsSubscribePost } from "@/generated/actions/subscriptions";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface SubscriptionPlansProps {
  plans: SubscriptionPlanResponse[];
  currentSubscription?: any;
}

const planIcons = {
  basic: Zap,
  premium: Sparkles,
  enterprise: Crown,
};

export function SubscriptionPlans({ plans, currentSubscription }: SubscriptionPlansProps) {
  const router = useRouter();

  const { execute: subscribe, isExecuting } = useAction(subscribeApiV1SubscriptionsSubscribePost, {
    onSuccess: () => {
      toast.success("Subscription activated successfully!");
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.message || "Failed to subscribe");
    },
  });

  const handleSubscribe = (planId: string) => {
    subscribe({
      query: {
        plan_id: planId,
      },
    });
  };

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-light">No subscription plans available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const Icon = planIcons[plan.name?.toLowerCase() as keyof typeof planIcons] || Sparkles;
        const isCurrentPlan = currentSubscription?.plan_id === plan.id;
        const isPopular = plan.name?.toLowerCase() === "premium";

        return (
          <Card
            key={plan.id}
            className={`rounded-[18px] border relative overflow-hidden ${
              isPopular ? "border-primary shadow-lg" : ""
            }`}
          >
            {isPopular && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-medium rounded-bl-[18px]">
                Popular
              </div>
            )}
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-[18px] bg-primary/10">
                  <Icon className="size-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-light">{plan.name}</CardTitle>
                  {plan.description && (
                    <CardDescription className="mt-1">{plan.description}</CardDescription>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-light">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.billing_period || "month"}</span>
                </div>
                {plan.currency && (
                  <p className="text-sm text-muted-foreground">{plan.currency}</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="size-5 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm font-light">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              {plan.limits && (
                <div className="space-y-2 pt-4 border-t">
                  {Object.entries(plan.limits).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground font-light capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="font-medium">{value || "Unlimited"}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full rounded-[18px]"
                variant={isCurrentPlan ? "outline" : "default"}
                disabled={isCurrentPlan || isExecuting}
                onClick={() => handleSubscribe(plan.id!)}
              >
                {isCurrentPlan ? "Current Plan" : isExecuting ? "Processing..." : "Subscribe"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function SubscriptionPlansLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-[18px] border">
          <CardHeader className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-12 w-24" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <Skeleton className="h-10 w-full rounded-[18px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

