"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Star, TrendingUp, Gift } from "lucide-react";
import { useGetLoyaltyStatusApiV1LoyaltyStatusGet } from "@/generated/hooks/loyalty";
import { Skeleton } from "@/components/ui/skeleton";

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  bronze: {
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  silver: {
    bg: "bg-gray-50 dark:bg-gray-900/50",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
  },
  gold: {
    bg: "bg-yellow-50 dark:bg-yellow-950/20",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  platinum: {
    bg: "bg-purple-50 dark:bg-purple-950/20",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
};

const tierIcons: Record<string, React.ReactNode> = {
  bronze: <Award className="h-5 w-5" />,
  silver: <Star className="h-5 w-5" />,
  gold: <TrendingUp className="h-5 w-5" />,
  platinum: <Gift className="h-5 w-5" />,
};

export function LoyaltyStatusCard() {
  const { data: status, isLoading, error } = useGetLoyaltyStatusApiV1LoyaltyStatusGet();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !status) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "فشل تحميل حالة الولاء"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const tier = status.tier.toLowerCase();
  const tierColor = tierColors[tier] || tierColors.bronze;
  const tierIcon = tierIcons[tier] || tierIcons.bronze;

  // Calculate progress to next tier
  const progressPercentage = status.points_to_next_tier
    ? Math.min(
        100,
        ((status.balance - (status.next_tier ? status.next_tier - status.points_to_next_tier : 0)) /
          status.points_to_next_tier) *
          100
      )
    : 100;

  return (
    <Card className={`${tierColor.border} border-2`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {tierIcon}
              <span className={tierColor.text}>{status.tier_name}</span>
            </CardTitle>
            <CardDescription>{status.program_name}</CardDescription>
          </div>
          <Badge variant="outline" className={tierColor.text}>
            {status.tier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Points Balance */}
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">رصيد النقاط</span>
            <span className="text-3xl font-bold">{status.balance.toLocaleString()}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {status.points_per_dollar} نقطة لكل دولار
          </p>
        </div>

        {/* Progress to Next Tier */}
        {status.points_to_next_tier && status.points_to_next_tier > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">التقدم للمستوى التالي</span>
              <span className="font-medium">
                {status.points_to_next_tier.toLocaleString()} نقطة متبقية
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>
        )}

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground mb-1">الخصم</p>
            <p className="text-lg font-semibold">{status.discount_percentage}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">الدعم</p>
            <p className="text-lg font-semibold">
              {status.priority_support ? "أولوية" : "عادي"}
            </p>
          </div>
        </div>

        {/* Points Expiry */}
        {status.expires_at && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              انتهاء النقاط: {new Date(status.expires_at).toLocaleDateString("ar-SA")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

