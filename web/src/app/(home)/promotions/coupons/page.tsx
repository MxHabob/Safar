import { Suspense } from "react";
import { Metadata } from "next";
import { CouponManagement } from "@/features/promotions/components/coupon-management";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Coupon Management - Safar",
  description: "Create and manage discount coupons",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CouponsPage() {
  return (
    <div className="min-h-screen w-full">
      <main className="w-full max-w-7xl mx-auto px-3 lg:px-6 py-8 lg:py-12">
        <Suspense fallback={<CouponsPageLoading />}>
          <CouponManagement />
        </Suspense>
      </main>
    </div>
  );
}

function CouponsPageLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}

