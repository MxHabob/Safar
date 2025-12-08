import { JSX, useId } from "react";

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

export const useConfirm = (
  title: string,
  message: string
): [() => JSX.Element, () => Promise<unknown>] => {
  const modalId = useId();
  const { type, isOpen, data, onOpen, onClose } = useModal();

  const confirm = () =>
    new Promise((resolve) => {
      onOpen("confirm", { modalId, resolve, title, message });
    });

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

  const ConfirmationDialog = () => {
    const isDialogOpen = isOpen && type === "confirm" && data?.modalId === modalId;
    const dialogTitle = (data?.title as string | undefined) ?? title;
    const dialogMessage = (data?.message as string | undefined) ?? message;

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

  return [ConfirmationDialog, confirm];
};
