import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Metadata } from "next";
import { SubscriptionPlansLoading } from "@/features/subscriptions/components/subscription-plans";
import {
  getSubscriptionPlansApiV1SubscriptionsPlansGet,
  getMySubscriptionApiV1SubscriptionsMySubscriptionGet,
} from "@/generated/actions/subscriptions";

const SubscriptionsPageView = dynamic(
  () =>
    import("@/features/subscriptions/subscriptions-page").then(
      (mod) => mod.SubscriptionsPage
    ),
  {
    loading: () => <SubscriptionPlansLoading />,
  }
);

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

    return (
      <SubscriptionsPageView
        plans={plans}
        currentSubscription={subscription}
      />
    );
  } catch (error) {
    return <SubscriptionsPageView plans={[]} currentSubscription={null} />;
  }
}

export default function SubscriptionsPageRoute() {
  return (
    <Suspense fallback={<SubscriptionPlansLoading />}>
      <SubscriptionsData />
    </Suspense>
  );
}

