"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FavoriteToggleProps {
  photoId: string;
  initialValue: boolean;
}

export function FavoriteToggle({ photoId, initialValue }: FavoriteToggleProps) {
  const [isFavorite, setIsFavorite] = useState(initialValue);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click if table has row click handler

    const newValue = !isFavorite;

    // Optimistic update
    setIsFavorite(newValue);

    toast.success(newValue ? "Added to favorites" : "Removed from favorites");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={false}
      className={cn(
        "h-8 w-8 transition-colors",
        isFavorite && "text-red-500 hover:text-red-600"
      )}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn("size-6 transition-all", isFavorite && "fill-current")}
      />
    </Button>
  );
}
