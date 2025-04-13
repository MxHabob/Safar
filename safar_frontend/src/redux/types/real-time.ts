import { Booking, Message ,Notification} from "./types";

// real-time/types.ts
export type WebSocketMessageType = 
  | 'initial_data'
  | 'booking_update'
  | 'new_message'
  | 'new_notification'
  | 'error'
  | 'pong';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType;
  payload: T;
}

export interface InitialDataPayload {
  bookings: Booking[];
  messages: Message[];
  notifications: Notification[];
}

export interface BookingUpdatePayload {
  booking: Booking;
  update_type: 'created' | 'updated' | 'cancelled';
}

export interface NewMessagePayload {
  message: Message;
}

export interface NewNotificationPayload {
  notification: Notification;
}

export interface ErrorPayload {
  message: string;
  code: string;
  retryable: boolean;
}

export interface WebSocketEventHandlers {
  onInitialData?: (payload: InitialDataPayload) => void;
  onBookingUpdate?: (payload: BookingUpdatePayload) => void;
  onNewMessage?: (payload: NewMessagePayload) => void;
  onNewNotification?: (payload: NewNotificationPayload) => void;
  onError?: (payload: ErrorPayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export type ConnectionState = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting';