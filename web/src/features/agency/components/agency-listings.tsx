"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import Link from "next/link";

interface AgencyListingsViewProps {
  listings: any[];
}

export function AgencyListingsView({ listings }: AgencyListingsViewProps) {
  if (listings.length === 0) {
    return (
      <EmptyState
        title="No listings yet"
        description="Create your first listing to start managing properties through your agency."
        action={
          <Button asChild className="rounded-[18px]">
            <Link href="/listings/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light">Your Listings</h2>
          <p className="text-muted-foreground text-sm">
            {listings.length} {listings.length === 1 ? "listing" : "listings"}
          </p>
        </div>
        <Button asChild className="rounded-[18px]">
          <Link href="/listings/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Listing
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing: any) => (
          <Card key={listing.id} className="rounded-[18px] border">
            <CardContent className="p-6">
              <h3 className="font-medium mb-2">{listing.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {listing.city}, {listing.country}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">${listing.base_price}/night</span>
                <span className="text-xs px-2 py-1 rounded-full bg-muted">
                  {listing.status}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AgencyListingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-[18px]" />
        ))}
      </div>
    </div>
  );
}

