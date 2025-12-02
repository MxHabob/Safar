import { Suspense } from "react";
import { getSubscriptionPlans } from "@/lib/server/queries/subscriptions";
import { SubscriptionPlans } from "@/components/subscriptions/SubscriptionPlans";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Subscription Plans",
  description: "Available subscription plans",
};

type SearchParams = Promise<{ plan_type?: "host" | "guest" }>;

export default async function SubscriptionPlansPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Subscription Plans</h1>
      <Suspense fallback={<PageSkeleton />}>
        <SubscriptionPlansContent planType={params.plan_type} />
      </Suspense>
    </div>
  );
}

async function SubscriptionPlansContent({ planType }: { planType?: "host" | "guest" }) {
  const plans = await getSubscriptionPlans(planType || "guest");
  return <SubscriptionPlans plans={plans} />;
}

