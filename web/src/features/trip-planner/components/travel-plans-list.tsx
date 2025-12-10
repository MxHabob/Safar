"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListTravelPlansApiV1AiTravelPlannerGet } from "@/generated/hooks/aiTravelPlanner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Users, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";
// Simple date formatter
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export function TravelPlansList() {
  const { data: plans, isLoading, error } = useListTravelPlansApiV1AiTravelPlannerGet(0, 50);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load travel plans"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Travel plans</CardTitle>
          <CardDescription>No travel plans yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start by creating a new AI travel plan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <Link key={plan.id} href={`/trip-planner/${plan.id}`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg line-clamp-2">
                  {plan.plan_title || plan.destination}
                </CardTitle>
                {plan.is_saved && (
                  <Badge variant="secondary" className="shrink-0">
                    Saved
                  </Badge>
                )}
              </div>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {plan.destination}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{plan.travelers_count} travelers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>
                  {plan.budget} {plan.currency}
                </span>
              </div>
              {plan.plan_summary && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                  {plan.plan_summary}
                </p>
              )}
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-primary">View details</span>
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

