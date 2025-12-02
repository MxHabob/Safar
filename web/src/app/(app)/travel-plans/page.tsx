import { Suspense } from "react";
import { getTravelPlans } from "@/lib/server/queries/travel-plans";
import { TravelPlansList } from "@/components/travel-plans/TravelPlansList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Travel Plans",
  description: "Your AI-generated travel plans",
};

export default async function TravelPlansPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Travel Plans</h1>
      <Suspense fallback={<PageSkeleton />}>
        <TravelPlansContent />
      </Suspense>
    </div>
  );
}

async function TravelPlansContent() {
  const plans = await getTravelPlans();
  return <TravelPlansList plans={plans} />;
}

