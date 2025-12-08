"use client";

import { Plus, Edit, Trash2, Eye, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteListingDialog } from "./delete-listing-dialog";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date";
import type { ListingResponse } from "@/generated/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface HostListingsProps {
  listings: ListingResponse[];
}

export function HostListings({ listings }: HostListingsProps) {
  if (!listings || listings.length === 0) {
    return (
      <Card className="rounded-[18px] border">
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground font-light mb-4">No listings yet</p>
          <Link href="/dashboard/listings/new">
            <Button className="rounded-[18px]">
              <Plus className="size-4" />
              Create Your First Listing
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light">Your Listings</h2>
          <Link href="/dashboard/listings/new">
          <Button className="rounded-[18px]">
            <Plus className="size-4" />
            New Listing
          </Button>
        </Link>
      </div>

      <div className="border rounded-[18px] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell className="font-medium">{listing.title}</TableCell>
                <TableCell>
                  <Badge
                    variant={listing.status === "active" ? "default" : "secondary"}
                    className="rounded-[18px]"
                  >
                    {listing.status || "draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {listing.city}, {listing.country}
                </TableCell>
                <TableCell>
                  {listing.base_price || "N/A"} {listing.currency || "USD"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {listing.created_at
                    ? formatDate(listing.created_at, "MMM d, yyyy")
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/listings/${listing.id}`}>
                      <Button variant="ghost" size="icon" className="rounded-[18px]">
                        <Eye className="size-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/listings/${listing.id}/edit`}>
                      <Button variant="ghost" size="icon" className="rounded-[18px]">
                        <Edit className="size-4" />
                      </Button>
                    </Link>
                    <DeleteListingDialog listingId={listing.id!} listingTitle={listing.title} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function HostListingsLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card className="rounded-[18px] border">
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

