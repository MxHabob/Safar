"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetLoyaltyHistoryApiV1LoyaltyHistoryGet } from "@/generated/hooks/loyalty";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, History } from "lucide-react";
// Simple date formatter
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function LoyaltyHistory({ limit = 20 }: { limit?: number }) {
  const { data: history, isLoading, error } = useGetLoyaltyHistoryApiV1LoyaltyHistoryGet(limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !history) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "فشل تحميل سجل المعاملات"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const transactions = history.transactions || [];

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            سجل المعاملات
          </CardTitle>
          <CardDescription>لا توجد معاملات حتى الآن</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          سجل المعاملات
        </CardTitle>
        <CardDescription>
          آخر {transactions.length} معاملة من أصل {history.total || 0}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction: any, index: number) => {
            const isEarned = transaction.type === "earned" || transaction.points > 0;
            const isRedeemed = transaction.type === "redeemed" || transaction.points < 0;
            const points = Math.abs(transaction.points || 0);
            const date = transaction.timestamp
              ? new Date(transaction.timestamp)
              : new Date(transaction.created_at || Date.now());

            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`p-2 rounded-full ${
                      isEarned
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    }`}
                  >
                    {isEarned ? (
                      <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">
                        {isEarned ? "إضافة نقاط" : "استبدال نقاط"}
                      </p>
                      <Badge variant={isEarned ? "default" : "secondary"}>
                        {isEarned ? "إضافة" : "استبدال"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.reason || transaction.description || "معاملة"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold text-lg ${
                      isEarned
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {isEarned ? "+" : "-"}
                    {points.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">نقطة</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

