"use client";

import { ResponsiveModal } from "@/components/shared/responsive-modal";
import MultiStepForm from "./multi-step-form";
import { useModal } from "@/lib/stores/modal-store";

const CreatePhotoModal = () => {
  const { isOpen, type, onOpen, onClose } = useModal();
  const isDialogOpen = isOpen && type === "createPhoto";

  const handleOpenChange = (open: boolean) => {
    if (open) {
      onOpen("createPhoto");
    } else {
      onClose();
    }
  };

  return (
    <ResponsiveModal
      open={isDialogOpen}
      onOpenChange={handleOpenChange}
      title="Create Photo"
      className="sm:max-w-3xl"
    >
      <MultiStepForm />
    </ResponsiveModal>
  );
};

export default CreatePhotoModal;
