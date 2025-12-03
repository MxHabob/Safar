import { Suspense } from "react";
import { getHostAnalytics } from "@/lib/server/queries/analytics";
import { HostAnalytics } from "@/components/analytics/HostAnalytics";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Analytics",
  description: "Your listing analytics",
};

export default async function HostAnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Analytics</h1>
      <Suspense fallback={<PageSkeleton />}>
        <HostAnalyticsContent />
      </Suspense>
    </div>
  );
}

async function HostAnalyticsContent() {
  const analytics = await getHostAnalytics();
  return <HostAnalytics data={analytics} />;
}

