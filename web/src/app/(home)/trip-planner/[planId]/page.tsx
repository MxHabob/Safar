import { Suspense } from "react";
import { TravelPlanDetail } from "@/features/trip-planner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ planId: string }>;
}

function TravelPlanDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function Page({ params }: PageProps) {
  const { planId } = await params;
  const planIdNumber = parseInt(planId, 10);

  if (isNaN(planIdNumber)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">معرف خطة السفر غير صحيح</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Suspense fallback={<TravelPlanDetailLoading />}>
        <TravelPlanDetail planId={planIdNumber} />
      </Suspense>
    </div>
  );
}

