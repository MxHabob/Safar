"use client";

import { Plus, Tag, Calendar, Users, Percent, DollarSign, Trash2 } from "lucide-react";
import { useListCouponsApiV1PromotionsCouponsGet } from "@/generated/hooks/promotions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { CreateCouponDialog } from "./create-coupon-dialog";
import { useModal } from "@/lib/stores/modal-store";

export function CouponManagement() {
  const { onOpen } = useModal();
  const { data: coupons, isLoading, refetch } = useListCouponsApiV1PromotionsCouponsGet(
    0,
    50,
    false // Show all coupons, not just active
  );

  if (isLoading) {
    return <CouponManagementLoading />;
  }

  const couponList = coupons || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light">Coupon Management</h2>
          <p className="text-sm text-muted-foreground font-light mt-1">
            Create and manage discount coupons
          </p>
        </div>
        <Button
          onClick={() => onOpen("createCoupon", { onSuccess: () => refetch() })}
          className="rounded-[18px] font-light"
        >
          <Plus className="size-4 mr-2" />
          Create Coupon
        </Button>
      </div>

      {couponList.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-12 w-12" />}
          title="No coupons yet"
          description="Create your first coupon to offer discounts to guests."
        />
      ) : (
        <div className="grid gap-4">
          {couponList.map((coupon) => {
            const isActive = coupon.is_active;
            const discountType = coupon.discount_type;
            const discountValue = coupon.discount_value || 0;
            const isPercentage = discountType === "percentage";
            const today = new Date();
            const startDate = new Date(coupon.start_date);
            const endDate = new Date(coupon.end_date);
            const isExpired = endDate < today;
            const isUpcoming = startDate > today;

            return (
              <Card
                key={coupon.id}
                className="rounded-[18px] border"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-light">{coupon.name}</h3>
                        <Badge
                          variant={isActive && !isExpired ? "default" : "secondary"}
                          className="rounded-full"
                        >
                          {isExpired
                            ? "Expired"
                            : isUpcoming
                            ? "Upcoming"
                            : isActive
                            ? "Active"
                            : "Inactive"}
                        </Badge>
                      </div>

                      {coupon.description && (
                        <p className="text-sm text-muted-foreground font-light">
                          {coupon.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Tag className="size-4 text-muted-foreground" />
                          <span className="font-mono font-light">{coupon.code}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPercentage ? (
                            <Percent className="size-4 text-muted-foreground" />
                          ) : (
                            <DollarSign className="size-4 text-muted-foreground" />
                          )}
                          <span className="font-light">
                            {isPercentage
                              ? `${discountValue}% off`
                              : `${discountValue} off`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-muted-foreground" />
                          <span className="font-light">
                            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                          </span>
                        </div>
                        {coupon.max_uses && (
                          <div className="flex items-center gap-2">
                            <Users className="size-4 text-muted-foreground" />
                            <span className="font-light">
                              {coupon.current_uses || 0} / {coupon.max_uses} uses
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateCouponDialog />
    </div>
  );
}

function CouponManagementLoading() {
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

