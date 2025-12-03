import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTravelPlan } from "@/lib/server/queries/travel-plans";
import { TravelPlanDetail } from "@/components/travel-plans/TravelPlanDetail";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

type Params = Promise<{ id: string }>;

export default async function TravelPlanPage({ params }: { params: Params }) {
  const { id } = await params;
  
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TravelPlanContent id={id} />
    </Suspense>
  );
}

async function TravelPlanContent({ id }: { id: string }) {
  const plan = await getTravelPlan(id);
  
  if (!plan) {
    notFound();
  }
  
  return <TravelPlanDetail plan={plan} />;
}

