import { Suspense } from "react";
import { getLoyaltyStatus } from "@/lib/server/queries/loyalty";
import { LoyaltyStatus } from "@/components/loyalty/LoyaltyStatus";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Loyalty Program",
  description: "Your loyalty points and status",
};

export default async function LoyaltyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Loyalty Program</h1>
      <Suspense fallback={<PageSkeleton />}>
        <LoyaltyContent />
      </Suspense>
    </div>
  );
}

async function LoyaltyContent() {
  const status = await getLoyaltyStatus();
  return <LoyaltyStatus status={status} />;
}

