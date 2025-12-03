import { Suspense } from "react";
import { getCoupons } from "@/lib/server/queries/promotions";
import { PromotionsList } from "@/components/promotions/PromotionsList";
import { PageSkeleton } from "@/components/shared/PageSkeleton";

export const metadata = {
  title: "Promotions",
  description: "Manage your promotions and coupons",
};

export default async function HostPromotionsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Promotions</h1>
      <Suspense fallback={<PageSkeleton />}>
        <HostPromotionsContent />
      </Suspense>
    </div>
  );
}

async function HostPromotionsContent() {
  const coupons = await getCoupons();
  return <PromotionsList coupons={coupons} />;
}

