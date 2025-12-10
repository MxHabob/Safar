"use client"

import { create } from "zustand"

export type ModalType =
  | "signOutConfirm"
  | "adminConfirmSuspendUser"
  | "adminConfirmActivateUser"
  | "adminConfirmDeleteUser"
  | "deleteAccountConfirm"
  | "confirm"

export interface ShareResultModalPayload {
  id: string
}

export interface ModalData {
  onConfirm?: (mfaCode?: string) => void | Promise<void>
  onSuccess?: () => void
  bookingId?: string
  modalId?: string
  title?: string
  message?: string
  payload?: unknown
  [key: string]: unknown
}

interface ModalStackItem {
  type: ModalType
  data: ModalData
}

interface ModalStore {
  type: ModalType | null
  data: ModalData
  isOpen: boolean
  stack: ModalStackItem[]
  onOpen: (type: ModalType, data?: ModalData) => void
  onClose: () => void
  onCloseAll: () => void
  getModalLevel: () => number
}

export const useModal = create<ModalStore>((set, get) => ({
  type: null,
  data: {},
  isOpen: false,
  stack: [],
  onOpen: (type, data = {}) => {
    const currentStack = get().stack
    const newStack = [...currentStack, { type, data }]
    const topModal = newStack[newStack.length - 1]

    set({
      isOpen: true,
      type: topModal.type,
      data: topModal.data,
      stack: newStack,
    })
  },
  onClose: () => {
    const currentStack = get().stack
    if (currentStack.length <= 1) {
      // Last modal, close everything
      set({ isOpen: false, type: null, data: {}, stack: [] })
    } else {
      // Remove top modal, show previous one
      const newStack = currentStack.slice(0, -1)
      const topModal = newStack[newStack.length - 1]
      set({
        type: topModal.type,
        data: topModal.data,
        stack: newStack,
      })
    }
  },
  onCloseAll: () => {
    set({ isOpen: false, type: null, data: {}, stack: [] })
  },
  getModalLevel: () => {
    const level = get().stack.length - 1
    return level < 0 ? 0 : level
  },
}))
