"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet } from "@/generated/hooks/loyalty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Gift, Sparkles } from "lucide-react";
import { RedeemPointsDialog } from "./redeem-points-dialog";
import { useGetLoyaltyStatusApiV1LoyaltyStatusGet } from "@/generated/hooks/loyalty";

export function RedemptionOptions() {
  const { data: options, isLoading, error } =
    useGetRedemptionOptionsApiV1LoyaltyRedemptionOptionsGet();
  const { data: status } = useGetLoyaltyStatusApiV1LoyaltyStatusGet();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !options) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "فشل تحميل خيارات الاستبدال"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const availableOptions = options.options || [];

  if (availableOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            خيارات الاستبدال
          </CardTitle>
          <CardDescription>لا توجد خيارات استبدال متاحة حالياً</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          خيارات الاستبدال المتاحة
        </CardTitle>
        <CardDescription>
          اختر من الخيارات التالية لاستبدال نقاطك
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableOptions.map((option) => {
            const canRedeem = status && status.balance >= option.points_required;
            const discountAmount = option.value;

            return (
              <div
                key={option.id}
                className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                  canRedeem ? "border-primary/20" : "opacity-60"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{option.name}</h4>
                    <Badge variant="outline" className="mt-1">
                      {option.type}
                    </Badge>
                  </div>
                  <Gift className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">النقاط المطلوبة</span>
                    <span className="font-medium">{option.points_required.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">قيمة الخصم</span>
                    <span className="font-bold text-primary">${discountAmount.toFixed(2)}</span>
                  </div>
                </div>

                <RedeemPointsDialog
                  bookingId={undefined}
                  trigger={
                    <button
                      className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      disabled={!canRedeem}
                    >
                      {canRedeem ? "استبدال الآن" : "نقاط غير كافية"}
                    </button>
                  }
                />
              </div>
            );
          })}
        </div>

        {/* Custom Redemption */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">استبدال مخصص</h4>
              <p className="text-sm text-muted-foreground">
                استبدل أي عدد من النقاط (مضاعفات 100)
              </p>
            </div>
            <RedeemPointsDialog
              trigger={
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
                  استبدال مخصص
                </button>
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

