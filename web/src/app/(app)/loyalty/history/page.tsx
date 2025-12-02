import { Suspense } from "react";
import { getLoyaltyHistory } from "@/lib/server/queries/loyalty";
import { LoyaltyHistory } from "@/components/loyalty/LoyaltyHistory";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Loyalty History",
  description: "Your loyalty points history",
};

export default async function LoyaltyHistoryPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Loyalty History</h1>
      <Suspense fallback={<PageSkeleton />}>
        <LoyaltyHistoryContent />
      </Suspense>
    </div>
  );
}

async function LoyaltyHistoryContent() {
  const history = await getLoyaltyHistory();
  return <LoyaltyHistory history={history} />;
}

