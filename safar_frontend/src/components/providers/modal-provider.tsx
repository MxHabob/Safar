"use client";

import { useEffect, useState } from "react";
import CreateOrEditPlaceModal from "../models/create-or-edit-place-modal";
import DeletePlaceModal from "../models/delete-place-modal";
import CreateOrEditExperienceModal from "../models/create-or-edit-experience-modal";
import DeleteExperienceModal from "../models/delete-experience-modal";
import BookingDetailsModal from "../models/booking-details-modal";
import BookingConfirmationOrCancellationModal from "../models/booking-confirmation-or-cancellation-modal";
import ChatModal from "../models/chat-modal";
import DiscountDetailsModal from "../models/discount-details-modal";
import BookingModificationModal from "../models/booking-modification-modal";
import SuccessOrFailureModal from "../models/success-or-failure-modal";
import PaymentConfirmationModal from "../models/payment-confirmation-modal";
import EventsModal from "../models/events-modal";

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
      <BookingModificationModal />
      <SuccessOrFailureModal />
      <PaymentConfirmationModal />
      <EventsModal />
      <ChatModal />
      <DiscountDetailsModal />
    </>
  )
}