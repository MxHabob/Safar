import { Booking, Message ,Notification, User} from "./types";

export type WebSocketMessageType = 
  | "initial_data" 
  | "booking_update" 
  | "new_message" 
  | "new_notification" 
  | "error";

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
  id: string;
  status: string;
}

export interface NewMessagePayload {
  id: string;
  sender: User;
  receiver: User;
  message_text: string;
  created_at: string;
}

export interface NewNotificationPayload {
  id: string;
  type: string;
  message: string;
  created_at: string;
}

export interface ErrorPayload {
  message: string;
}

export type WebSocketEventHandlers = {
  onInitialData?: (data: InitialDataPayload) => void;
  onBookingUpdate?: (data: BookingUpdatePayload) => void;
  onNewMessage?: (data: NewMessagePayload) => void;
  onNewNotification?: (data: NewNotificationPayload) => void;
  onError?: (error: ErrorPayload) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
};