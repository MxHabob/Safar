import { Suspense } from "react";
import { Metadata } from "next";
import { SubscriptionsPage } from "@/features/subscriptions/subscriptions-page";
import { SubscriptionPlansLoading } from "@/features/subscriptions/components/subscription-plans";
import {
  getSubscriptionPlansApiV1SubscriptionsPlansGet,
  getMySubscriptionApiV1SubscriptionsMySubscriptionGet,
} from "@/generated/actions/subscriptions";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Manage your subscription plans and billing",
  robots: {
    index: false,
    follow: false,
  },
};

export const revalidate = 300;

async function SubscriptionsData() {
  try {
    const [plansResult, subscriptionResult] = await Promise.all([
      getSubscriptionPlansApiV1SubscriptionsPlansGet({}).catch(() => null),
      getMySubscriptionApiV1SubscriptionsMySubscriptionGet({}).catch(() => null),
    ]);

    const plans = plansResult?.data || [];
    const subscription = subscriptionResult?.data || null;

    return <SubscriptionsPage plans={plans} currentSubscription={subscription} />;
  } catch (error) {
    return <SubscriptionsPage plans={[]} currentSubscription={null} />;
  }
}

export default function SubscriptionsPageRoute() {
  return (
    <Suspense fallback={<SubscriptionPlansLoading />}>
      <SubscriptionsData />
    </Suspense>
  );
}

