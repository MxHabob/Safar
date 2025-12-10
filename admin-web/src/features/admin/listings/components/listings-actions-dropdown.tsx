"use client";

import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { AdminListingResponse } from "@/generated/schemas";
import { useRouter } from "next/navigation";
import { useModal } from "@/lib/stores/modal-store";

interface ListingActionsProps {
  listing: AdminListingResponse;
}

export function ListingActionsDropdown({ listing }: ListingActionsProps) {
  const router = useRouter();
  const { onOpen } = useModal();

  const handleViewDetails = () => {
    router.push(`/listings/${listing.id}`);
  };

  const handleEditListing = () => {
    onOpen("adminEditListing", {
      listingId: listing.id,
      listingTitle: listing.title,
      payload: {
        title: listing.title,
        price_per_night: listing.price_per_night,
        status: listing.status,
      },
    });
  };

  const handleDeleteListing = () => {
    onOpen("adminConfirmDeleteListing", {
      listingId: listing.id,
      listingTitle: listing.title,
      onSuccess: () => {
        // Data will be refetched automatically by the modal
      },
    });
  };

  return (
    <div className="text-right">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEditListing}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Listing</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleDeleteListing}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete Listing</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

