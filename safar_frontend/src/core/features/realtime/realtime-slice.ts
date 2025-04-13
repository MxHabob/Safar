import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import type { Message, Notification, Booking } from "@/core/types"

interface RealtimeState {
  messages: Record<string, Message>
  notifications: Record<string, Notification>
  bookings: Record<string, Booking>
  isLoading: boolean
  error: string | null
}

const initialState: RealtimeState = {
  messages: {},
  notifications: {},
  bookings: {},
  isLoading: false,
  error: null,
}

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    setInitialData: (
      state,
      action: PayloadAction<{
        messages: Message[]
        notifications: Notification[]
        bookings: Booking[]
      }>,
    ) => {
      state.isLoading = false

      // Convert arrays to record objects for O(1) lookups
      action.payload.messages.forEach((message) => {
        state.messages[message.id] = message
      })

      action.payload.notifications.forEach((notification) => {
        state.notifications[notification.id] = notification
      })

      action.payload.bookings.forEach((booking) => {
        state.bookings[booking.id] = booking
      })
    },

    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload
      state.messages[message.id] = message
    },

    markMessageRead: (state, action: PayloadAction<string>) => {
      const messageId = action.payload
      if (state.messages[messageId]) {
        state.messages[messageId].is_read = true
      }
    },

    addNotification: (state, action: PayloadAction<Notification>) => {
      const notification = action.payload
      state.notifications[notification.id] = notification
    },

    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notificationId = action.payload
      if (state.notifications[notificationId]) {
        state.notifications[notificationId].is_read = true
      }
    },

    markAllNotificationsRead: (state) => {
      Object.keys(state.notifications).forEach((id) => {
        state.notifications[id].is_read = true
      })
    },

    updateBooking: (state, action: PayloadAction<Booking>) => {
      const booking = action.payload
      state.bookings[booking.id] = booking
    },

    setRealtimeLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },

    setRealtimeError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },

    clearRealtimeData: (state) => {
      state.messages = {}
      state.notifications = {}
      state.bookings = {}
    },
  },
})

export const {
  setInitialData,
  addMessage,
  markMessageRead,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  updateBooking,
  setRealtimeLoading,
  setRealtimeError,
  clearRealtimeData,
} = realtimeSlice.actions

export default realtimeSlice.reducer
