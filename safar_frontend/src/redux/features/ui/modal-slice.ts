import { Booking, Box, Experience, Place } from '@/redux/types/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ModalType = "CreateReservation" | "editPost" | "deletePost" | "ConfirmChangeStatus";

export interface ModalData {
  Place?: Place;
  Experience?: Experience;
  Box?: Box;
  Booking?: Booking;
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