import type { Notification } from "@/redux/types/types";

export type NotificationType = "All" | "Booking Update" | "Payment" | "Discount" | "Message" | "General";
export type ReadStatus = "All" | "Read" | "Unread";

export interface NotificationsFilters {
  searchQuery: string;
  typeFilter: NotificationType;
  readFilter: ReadStatus;
}

export interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onMarkAsUnread: () => void;
  onDelete?: () => void;
}