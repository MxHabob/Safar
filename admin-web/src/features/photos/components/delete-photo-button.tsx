"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";

interface DeletePhotoButtonProps {
  photoId: string;
  photoTitle: string;
}

export function DeletePhotoButton({
  photoId,
  photoTitle,
}: DeletePhotoButtonProps) {
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Photo",
    `Are you sure you want to delete "${photoTitle}"? This action cannot be undone. The photo will be permanently deleted.`
  );

  const handleDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

    toast.success("Photo deleted successfully");
  };

  return (
    <>
      <ConfirmDialog />
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete();
        }}
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        title="Delete photo"
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}
