"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PopularDestination {
  city: string;
  country: string;
  bookings: number;
  avg_revenue: number;
}

interface PopularDestinationsProps {
  destinations?: PopularDestination[];
  periodDays?: number;
  isLoading?: boolean;
}

export function PopularDestinations({
  destinations,
  periodDays = 30,
  isLoading,
}: PopularDestinationsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!destinations || destinations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Popular Destinations
          </CardTitle>
          <CardDescription>Last {periodDays} days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Popular Destinations
        </CardTitle>
        <CardDescription>Last {periodDays} days</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destination</TableHead>
              <TableHead className="text-right">Bookings</TableHead>
              <TableHead className="text-right">Avg Revenue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.map((destination, index) => (
              <TableRow key={`${destination.city}-${destination.country}-${index}`}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{destination.city}</span>
                    <span className="text-sm text-muted-foreground">
                      {destination.country}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {destination.bookings}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ${destination.avg_revenue.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

