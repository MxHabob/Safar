import { Booking, Flight, Experience, Place, Message, User, Media } from '@/core/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ModalType = "CreateOrEditPlace" | "deletePlace" | "CreateOrEditExperience" | "deleteExperience" | "BookingDetails" | "BookingConfirmationOrCancellation" | "BookingModification" | "SuccessOrFailure" | "PaymentConfirmation" | "Events" | "ChatModel" | "DiscountDetails" | "MediaModal" | "ShareModal" | "LanguageSwitchingModels"

export interface ModalData {
  Place?: Place;
  Experience?: Experience;
  Flight?: Flight;
  Booking?: Booking;
  otherUser?: User;
  messages?: Message;
  message?: string;
  success?: boolean;
  media?:Media;
  mediaArray?:Media[];
  initialIndex?:number;
}

interface ModalState {
  type: ModalType | null;
  data: ModalData;
  isOpen: boolean;
}

const initialState: ModalState = {
  type: null,
  data: {},
  isOpen: false,
};

const modalSlice = createSlice({
  name: 'modal',
  initialState,
  reducers: {
    openModal: (state, action: PayloadAction<{ type: ModalType; data?: ModalData }>) => {
      state.isOpen = true;
      state.type = action.payload.type;
      state.data = action.payload.data || {};
    },
    closeModal: (state) => {
      state.isOpen = false;
      state.type = null;
      state.data = {};
    },
  },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;