"use client";

import { useEffect, useState } from "react";
import CreateOrEditPlaceModal from "@/components/models/create-or-edit-place-modal";
import DeletePlaceModal from "@/components/models/delete-place-modal";
import CreateOrEditExperienceModal from "@/components/models/create-or-edit-experience-modal";
import DeleteExperienceModal from "@/components//models/delete-experience-modal";
import BookingDetailsModal from "@/components/models/booking-details-modal";
import BookingConfirmationOrCancellationModal from "@/components/models/booking-confirmation-or-cancellation-modal";
import DiscountDetailsModal from "@/components/models/discount-details-modal";
// import BookingModificationModal from "@/components/models/booking-modification-modal";
import SuccessOrFailureModal from "@/components/models/success-or-failure-modal";
import PaymentConfirmationModal from "@/components/models/payment-confirmation-modal";
import EventsModal from "@/components/models/events-modal";
import { MediaModal } from "@/components/models/media-model";

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <CreateOrEditPlaceModal />
      <DeletePlaceModal />
      <CreateOrEditExperienceModal />
      <DeleteExperienceModal />
      <BookingDetailsModal />
      <BookingConfirmationOrCancellationModal />
      {/* <BookingModificationModal /> */}
      <MediaModal/>
      <SuccessOrFailureModal />
      <PaymentConfirmationModal />
      <EventsModal />
      <DiscountDetailsModal />
    </>
  )
}