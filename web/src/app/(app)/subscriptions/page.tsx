import { Suspense } from "react";
import { getSubscription } from "@/lib/server/queries/subscriptions";
import { SubscriptionStatus } from "@/components/subscriptions/SubscriptionStatus";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Subscriptions",
  description: "Your subscription",
};

export default async function SubscriptionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Subscriptions</h1>
      <Suspense fallback={<PageSkeleton />}>
        <SubscriptionsContent />
      </Suspense>
    </div>
  );
}

async function SubscriptionsContent() {
  const subscription = await getSubscription();
  return <SubscriptionStatus subscription={subscription} />;
}

