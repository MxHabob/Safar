"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

interface VisibilityToggleProps {
  photoId: string;
  initialValue: "public" | "private";
}

export function VisibilityToggle({
  photoId,
  initialValue,
}: VisibilityToggleProps) {
  const [visibility, setVisibility] = useState(initialValue);

  const handleToggle = async (checked: boolean) => {
    const newValue = checked ? "public" : "private";

    // Optimistic update
    setVisibility(newValue);

  };

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
    >
      {visibility === "public" ? (
        <Eye className="h-4 w-4 text-green-600" />
      ) : (
        <EyeOff className="h-4 w-4 text-muted-foreground" />
      )}
      <Switch
        checked={visibility === "public"}
        onCheckedChange={handleToggle}
        disabled={false}
        aria-label="Toggle visibility"
      />
      <span className="text-sm text-muted-foreground min-w-[50px]">
        {visibility === "public" ? "Public" : "Private"}
      </span>
    </div>
  );
}
