"use client";

import { ColumnDef } from "@tanstack/react-table";
import { keyToImage } from "@/lib/keyToImage";
import BlurImage from "@/components/shared/blur-image";
import { format } from "date-fns";
import { FavoriteToggle } from "./favorite-toggle";
import { VisibilityToggle } from "./visibility-toggle";
import { DeletePhotoButton } from "./delete-photo-button";
import Link from "next/link";
import { PenBoxIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUploadResponse } from "@/generated/schemas";

export const columns: ColumnDef<FileUploadResponse["file"]>[] = [
  {
    accessorKey: "url",
    header: "Image",
    cell: ({ row }) => {
      const url = row.original.file_url;
      const imageUrl = keyToImage(url);

      return (
        <div className="w-16 h-16 overflow-hidden">
          <BlurImage
            src={imageUrl}
            alt={row.original.original_filename}
            width={64}
            height={64}
            blurhash={row.original.description}
            className="w-16 h-16 object-cover"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "dateTimeOriginal",
    header: "Taken At",
    cell: ({ row }) => {
      const takenAt = row.original.created_at;
      if (!takenAt) return <span>-</span>;

      // Use date-fns for consistent formatting across SSR and client
      const formatted = format(new Date(takenAt), "MMM d, yyyy HH:mm");

      return <span suppressHydrationWarning>{formatted}</span>;
    },
  },
  {
    accessorKey: "city",
    header: "City",
    cell: ({ row }) => {
      const location = row.original.file_category;
      return <span>{location}</span>;
    },
  },
  {
    accessorKey: "isFavorite",
    header: "Favorite",
    cell: ({ row }) => {
      return (
        <FavoriteToggle
          photoId={row.original.id.toString()}
          initialValue={false}
        />
      );
    },
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => {
      return (
        <VisibilityToggle
          photoId={row.original.id.toString()}
          initialValue="private"
        />
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <DeletePhotoButton
            photoId={row.original.id.toString()}
            photoTitle={row.original.original_filename}
          />

          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/photos/${row.original.id.toString()}`}>
              <PenBoxIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    },
  },
];
