"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { 
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
  useDeleteNotificationMutation
} from "@/redux/services/api";
import { NotificationActions } from "./NotificationActions";
import { NotificationFilters } from "./NotificationFilters";
import { NotificationsList } from "./NotificationsList";
import type { NotificationsFilters } from "./types";

export const NotificationsPageContent = () => {
  const { data: notificationsData, refetch } = useGetNotificationsQuery({});
  const notifications = notificationsData?.results || [];

  const [markAsRead] = useMarkNotificationAsReadMutation();
  const [markAllAsRead] = useMarkAllNotificationsAsReadMutation();
  const [deleteNotification] = useDeleteNotificationMutation();

  const [filters, setFilters] = useState<NotificationsFilters>({
    searchQuery: "",
    typeFilter: "All",
    readFilter: "All"
  });

  const filteredNotifications = notifications.filter((notification) => {
    if (filters.searchQuery && !notification.message.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
      return false;
    }

    if (filters.typeFilter !== "All" && notification.type !== filters.typeFilter) {
      return false;
    }

    if (filters.readFilter === "Read" && !notification.is_read) {
      return false;
    }

    if (filters.readFilter === "Unread" && notification.is_read) {
      return false;
    }

    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    console.log("Mark as unread not implemented yet");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead().unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleClearAll = async () => {
    console.log("Clear all not implemented yet");
  };

  const handleFiltersChange = (newFilters: Partial<NotificationsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            You have {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
          </p>
        </div>

        <NotificationActions
          unreadCount={unreadCount}
          totalCount={notifications.length}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClearAll={handleClearAll}
        />
      </div>

      <NotificationFilters 
        filters={filters} 
        onFiltersChange={handleFiltersChange} 
      />

      <NotificationsList
        notifications={notifications}
        filteredNotifications={filteredNotifications}
        filters={filters}
        onMarkAsRead={handleMarkAsRead}
        onMarkAsUnread={handleMarkAsUnread}
        onDelete={handleDelete}
      />
    </div>
  );
}