"use client";

import { Suspense } from "react";
import { SubscriptionPlans, SubscriptionPlansLoading } from "./components/subscription-plans";
import { CurrentSubscription } from "./components/current-subscription";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Package } from "lucide-react";

interface SubscriptionsPageProps {
  plans: any[];
  currentSubscription?: any;
}

export function SubscriptionsPage({ plans, currentSubscription }: SubscriptionsPageProps) {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground font-light">
            Choose a plan that fits your needs
          </p>
        </div>

        <Tabs defaultValue="plans" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 rounded-[18px]">
            <TabsTrigger value="plans" className="rounded-[18px]">
              <Package className="size-4" />
              Plans
            </TabsTrigger>
            <TabsTrigger value="current" className="rounded-[18px]">
              <CreditCard className="size-4" />
              Current Subscription
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plans" className="mt-6">
            <Suspense fallback={<SubscriptionPlansLoading />}>
              <SubscriptionPlans plans={plans} currentSubscription={currentSubscription} />
            </Suspense>
          </TabsContent>

          <TabsContent value="current" className="mt-6">
            <Suspense fallback={<SubscriptionPlansLoading />}>
              <CurrentSubscription subscription={currentSubscription} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

