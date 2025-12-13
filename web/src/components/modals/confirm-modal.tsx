"use client";

import { useId } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useModal } from "@/lib/stores/modal-store";

export const ConfirmModal = () => {
  const modalId = useId();
  const { type, isOpen, data, onClose } = useModal();
  const isDialogOpen = isOpen && type === "confirm" && data?.modalId === modalId;

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    const resolve = data?.resolve as ((value: boolean) => void) | undefined;
    resolve?.(true);
    handleClose();
  };

  const handleCancel = () => {
    const resolve = data?.resolve as ((value: boolean) => void) | undefined;
    resolve?.(false);
    handleClose();
  };

  const dialogTitle = data?.title as string | undefined;
  const dialogMessage = data?.message as string | undefined;

  if (!isDialogOpen) return null;

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogMessage}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-4">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

