"use client";

import { Tag, Percent, DollarSign, Calendar, Users } from "lucide-react";
import { useGetApplicablePromotionsApiV1PromotionsApplicableGet } from "@/generated/hooks/promotions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { cn } from "@/lib/utils";

interface AvailablePromotionsProps {
  listingId?: string;
  checkInDate?: string;
  nights?: number;
  guests?: number;
  onPromotionSelect?: (promotionId: string) => void;
}

export function AvailablePromotions({
  listingId,
  checkInDate,
  nights,
  guests,
  onPromotionSelect,
}: AvailablePromotionsProps) {
  const { data, isLoading, error } = useGetApplicablePromotionsApiV1PromotionsApplicableGet(
    listingId || undefined,
    checkInDate || undefined,
    nights || undefined,
    guests || undefined
  );

  if (isLoading) {
    return <AvailablePromotionsLoading />;
  }

  if (error || !data || data.length === 0) {
    return null; // Don't show anything if no promotions
  }

  const promotions = data;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-light text-muted-foreground">Available Promotions</h3>
      <div className="space-y-2">
        {promotions.map((promo) => {
          const discountType = promo.discount_type;
          const discountValue = promo.discount_value || 0;
          const isPercentage = discountType === "percentage";
          const isFlashSale = promo.promotion_type === "flash_sale";

          return (
            <Card
              key={promo.id}
              className={cn(
                "rounded-[18px] border cursor-pointer transition-all hover:border-foreground/20",
                isFlashSale && "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10"
              )}
              onClick={() => onPromotionSelect?.(promo.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-light text-sm">{promo.name}</h4>
                      {isFlashSale && (
                        <Badge variant="destructive" className="rounded-full text-xs">
                          Flash Sale
                        </Badge>
                      )}
                    </div>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground font-light line-clamp-2">
                        {promo.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-light">
                      <div className="flex items-center gap-1">
                        {isPercentage ? (
                          <Percent className="size-3" />
                        ) : (
                          <DollarSign className="size-3" />
                        )}
                        <span>
                          {isPercentage
                            ? `${discountValue}% off`
                            : `${discountValue} off`}
                        </span>
                      </div>
                      {promo.start_date && promo.end_date && (
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          <span>
                            {new Date(promo.start_date).toLocaleDateString()} -{" "}
                            {new Date(promo.end_date).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Tag className="size-5 text-muted-foreground shrink-0" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function AvailablePromotionsLoading() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-[18px]" />
      ))}
    </div>
  );
}

