"use client";

import { Bell } from "lucide-react";
import { NotificationItem } from "./notification-item";
import { NotificationsFilters } from "./types";
import { Notification } from "@/core/types";


interface NotificationsListProps {
  notifications: Notification[];
  filteredNotifications: Notification[];
  filters: NotificationsFilters;
  onMarkAsRead: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function NotificationsList({ 
  notifications,
  filteredNotifications,
  onMarkAsRead,
  onDelete
}: NotificationsListProps) {
  if (filteredNotifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Bell className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No notifications found</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {notifications.length === 0
            ? "You don't have any notifications yet. We'll notify you of important updates and offers."
            : "No notifications match your current filters. Try adjusting your search or filters."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredNotifications.map((notification) => (
        <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => onMarkAsRead(notification.id)}
              onDelete={notification.id && onDelete ? () => onDelete(notification.id) : undefined} onMarkAsUnread={function (): void {
                  throw new Error("Function not implemented.");
              } }        />
      ))}
    </div>
  );
}