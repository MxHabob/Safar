"use client";

import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useConfirm } from "@/hooks/use-confirm";

interface DeletePostButtonProps {
  postId: string;
  postTitle: string;
}

export function DeletePostButton({ postId, postTitle }: DeletePostButtonProps) {

  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Post",
    `Are you sure you want to delete "${postTitle}"? This action cannot be undone. The post will be permanently deleted.`
  );


  const handleDelete = async () => {
    const ok = await confirm();

    if (!ok) return;

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
        title="Delete post"
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}
