"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  Home, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down" | "neutral";
  description?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend = "neutral",
  description,
}: MetricCardProps) {
  const isPositive = trend === "up";
  const hasChange = change !== undefined && change !== null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hasChange && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600" />
            )}
            <span
              className={cn(
                "font-medium",
                isPositive ? "text-green-600" : "text-red-600"
              )}
            >
              {Math.abs(change)}%
            </span>
            {changeLabel && (
              <span className="text-muted-foreground"> {changeLabel}</span>
            )}
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricsCardsProps {
  metrics?: {
    bookings?: {
      total?: number;
      change?: number;
      completed?: number;
      pending?: number;
    };
    revenue?: {
      total?: number;
      change?: number;
      this_month?: number;
      last_month?: number;
    };
    users?: {
      total?: number;
      change?: number;
      active?: number;
      new?: number;
    };
    listings?: {
      total?: number;
      change?: number;
      active?: number;
      pending?: number;
    };
  };
  isLoading?: boolean;
}

export function MetricsCards({ metrics, isLoading }: MetricsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 bg-muted animate-pulse rounded mt-2" />
              <div className="h-4 w-20 bg-muted animate-pulse rounded mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Total Bookings"
        value={metrics?.bookings?.total?.toLocaleString() || "0"}
        change={metrics?.bookings?.change}
        changeLabel="from last month"
        icon={Calendar}
        trend={metrics?.bookings?.change && metrics.bookings.change > 0 ? "up" : "down"}
        description={`${metrics?.bookings?.completed || 0} completed, ${metrics?.bookings?.pending || 0} pending`}
      />
      <MetricCard
        title="Total Revenue"
        value={`$${metrics?.revenue?.total?.toLocaleString() || "0"}`}
        change={metrics?.revenue?.change}
        changeLabel="from last month"
        icon={DollarSign}
        trend={metrics?.revenue?.change && metrics.revenue.change > 0 ? "up" : "down"}
        description={`$${metrics?.revenue?.this_month?.toLocaleString() || "0"} this month`}
      />
      <MetricCard
        title="Total Users"
        value={metrics?.users?.total?.toLocaleString() || "0"}
        change={metrics?.users?.change}
        changeLabel="from last month"
        icon={Users}
        trend={metrics?.users?.change && metrics.users.change > 0 ? "up" : "down"}
        description={`${metrics?.users?.active || 0} active, ${metrics?.users?.new || 0} new`}
      />
      <MetricCard
        title="Total Listings"
        value={metrics?.listings?.total?.toLocaleString() || "0"}
        change={metrics?.listings?.change}
        changeLabel="from last month"
        icon={Home}
        trend={metrics?.listings?.change && metrics.listings.change > 0 ? "up" : "down"}
        description={`${metrics?.listings?.active || 0} active, ${metrics?.listings?.pending || 0} pending`}
      />
    </div>
  );
}

