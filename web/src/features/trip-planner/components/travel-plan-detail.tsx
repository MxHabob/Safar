"use client";

import { useGetTravelPlanApiV1AiTravelPlannerPlanIdGet } from "@/generated/hooks/aiTravelPlanner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Utensils,
  Activity,
  Hotel,
  Car,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Simple date formatter
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

interface TravelPlanDetailProps {
  planId: string;
}

export function TravelPlanDetail({ planId }: TravelPlanDetailProps) {
  const { data: plan, isLoading, error } =
    useGetTravelPlanApiV1AiTravelPlannerPlanIdGet(planId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Failed to load travel plan"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                {plan.plan_title || plan.destination}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {plan.destination}
              </CardDescription>
            </div>
            {plan.is_saved && (
              <Badge variant="secondary">Saved</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="text-sm font-medium">{formatDate(plan.start_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="text-sm font-medium">{formatDate(plan.end_date)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Travelers</p>
                <p className="text-sm font-medium">{plan.travelers_count}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Budget</p>
                <p className="text-sm font-medium">
                  {plan.budget} {plan.currency}
                </p>
              </div>
            </div>
          </div>

          {plan.plan_summary && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm">{plan.plan_summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Itinerary */}
      {plan.daily_itinerary && plan.daily_itinerary.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily itinerary</CardTitle>
            <CardDescription>
              {plan.duration_days} days of planned activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {plan.daily_itinerary.map((day: any, index: number) => (
                <div key={index} className="border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Day {day.day || index + 1}</Badge>
                    {day.date && (
                      <span className="text-sm text-muted-foreground">
                        {formatDate(day.date)}
                      </span>
                    )}
                  </div>
                  {day.activities && day.activities.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Activities
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {day.activities.map((activity: any, i: number) => (
                          <li key={i}>
                            {activity.name || activity.title || JSON.stringify(activity)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {day.restaurants && day.restaurants.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Restaurants
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {day.restaurants.map((restaurant: any, i: number) => (
                          <li key={i}>
                            {restaurant.name || restaurant.title || JSON.stringify(restaurant)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {day.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      {day.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Properties */}
      {plan.recommended_properties && plan.recommended_properties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Recommended stays
            </CardTitle>
            <CardDescription>
              {plan.recommended_properties.length} recommended properties
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.recommended_properties.map((propertyId: number) => (
                <Link key={propertyId} href={`/listings/${propertyId}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Property #{propertyId}</span>
                        <Button variant="ghost" size="sm">
                          View details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Activities */}
      {plan.recommended_activities && plan.recommended_activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recommended activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.recommended_activities.map((activity: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">
                    {activity.name || activity.title || `Activity ${index + 1}`}
                  </h4>
                  {activity.description && (
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  )}
                  {activity.cost && (
                    <p className="text-sm font-medium mt-2">
                      Cost: {activity.cost} {plan.currency}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Restaurants */}
      {plan.recommended_restaurants && plan.recommended_restaurants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              Recommended restaurants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plan.recommended_restaurants.map((restaurant: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">
                    {restaurant.name || restaurant.title || `Restaurant ${index + 1}`}
                  </h4>
                  {restaurant.description && (
                    <p className="text-sm text-muted-foreground">{restaurant.description}</p>
                  )}
                  {restaurant.cuisine && (
                    <Badge variant="outline" className="mt-2">
                      {restaurant.cuisine}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Breakdown */}
      {(plan.estimated_accommodation_cost ||
        plan.estimated_activities_cost ||
        plan.estimated_food_cost ||
        plan.estimated_transportation_cost) && (
        <Card>
          <CardHeader>
            <CardTitle>Estimated cost breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.estimated_accommodation_cost && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hotel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Stay</span>
                  </div>
                  <span className="font-medium">
                    {plan.estimated_accommodation_cost} {plan.currency}
                  </span>
                </div>
              )}
              {plan.estimated_activities_cost && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Activities</span>
                  </div>
                  <span className="font-medium">
                    {plan.estimated_activities_cost} {plan.currency}
                  </span>
                </div>
              )}
              {plan.estimated_food_cost && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Food</span>
                  </div>
                  <span className="font-medium">
                    {plan.estimated_food_cost} {plan.currency}
                  </span>
                </div>
              )}
              {plan.estimated_transportation_cost && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Transport</span>
                  </div>
                  <span className="font-medium">
                    {plan.estimated_transportation_cost} {plan.currency}
                  </span>
                </div>
              )}
              {plan.total_estimated_cost && (
                <div className="flex items-center justify-between pt-3 border-t font-semibold">
                  <span>Total</span>
                  <span>
                    {plan.total_estimated_cost} {plan.currency}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

