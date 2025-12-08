"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteListingApiV1ListingsListingIdDelete } from "@/generated/actions/listings";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DeleteListingDialogProps {
  listingId: string;
  listingTitle?: string;
}

export function DeleteListingDialog({ listingId, listingTitle }: DeleteListingDialogProps) {
  const router = useRouter();

  const { execute: deleteListing, isExecuting } = useAction(deleteListingApiV1ListingsListingIdDelete, {
    onSuccess: () => {
      toast.success("Listing deleted successfully");
      router.push("/dashboard");
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.message || "Failed to delete listing");
    },
  });

  const handleDelete = () => {
    deleteListing({
      path: {
        listing_id: listingId,
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-[18px] text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-[18px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Listing</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{listingTitle || "this listing"}"? This action cannot be undone.
            All bookings associated with this listing will also be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-[18px]">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isExecuting}
            className="rounded-[18px] bg-destructive hover:bg-destructive/90"
          >
            {isExecuting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

