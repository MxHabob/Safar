"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, X, Trash2, Settings } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import Link from "next/link";
import { formatDate } from "@/lib/utils/date";

interface Notification {
  id: string;
  type: "booking" | "review" | "message" | "system" | "promotion";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    // Note: Notifications API endpoint not available yet
    // Using simulated data until API is implemented
    // TODO: Replace with actual notifications API when available
    const fetchNotifications = async () => {
      try {
        // Simulated API call
        // const response = await getNotificationsApiV1NotificationsGet();
        // setNotifications(response.data || []);
        
        // Temporary: Simulated data
        setTimeout(() => {
          setNotifications([
            {
              id: "1",
              type: "booking",
              title: "New Booking",
              message: "You have a new booking for 'Cozy Apartment in Downtown'",
              read: false,
              createdAt: new Date().toISOString(),
              link: "/bookings/123",
            },
            {
              id: "2",
              type: "review",
              title: "New Review",
              message: "John Doe left a 5-star review for your listing",
              read: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              link: "/listings/456/reviews",
            },
            {
              id: "3",
              type: "message",
              title: "New Message",
              message: "You have a new message from Jane Smith",
              read: true,
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              link: "/messages",
            },
            {
              id: "4",
              type: "system",
              title: "System Update",
              message: "Your payout of $1,250 has been processed",
              read: true,
              createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
          ]);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications =
    filter === "unread"
      ? notifications.filter((n) => !n.read)
      : notifications;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success("Notification marked as read");
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success("Notification deleted");
  };

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "booking":
        return "📅";
      case "review":
        return "⭐";
      case "message":
        return "💬";
      case "system":
        return "⚙️";
      case "promotion":
        return "🎉";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type: Notification["type"]) => {
    switch (type) {
      case "booking":
        return "bg-blue-500/10 text-blue-600";
      case "review":
        return "bg-yellow-500/10 text-yellow-600";
      case "message":
        return "bg-green-500/10 text-green-600";
      case "system":
        return "bg-gray-500/10 text-gray-600";
      case "promotion":
        return "bg-purple-500/10 text-purple-600";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return <NotificationsPageLoading />;
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-light tracking-tight">Notifications</h1>
            <p className="text-muted-foreground font-light mt-2">
              Stay updated with your account activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllAsRead}
                className="rounded-[18px]"
                size="sm"
              >
                Mark all as read
              </Button>
            )}
            <Link href="/account/settings">
              <Button variant="outline" className="rounded-[18px]" size="sm">
                <Settings className="size-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
            className="rounded-[18px]"
            size="sm"
          >
            All ({notifications.length})
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            onClick={() => setFilter("unread")}
            className="rounded-[18px]"
            size="sm"
          >
            Unread ({unreadCount})
          </Button>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <Card className="rounded-[18px] border">
            <CardContent className="p-12 text-center">
              <Bell className="size-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-light">
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`rounded-[18px] border ${
                  !notification.read ? "border-primary/50 bg-primary/5" : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`size-12 rounded-full flex items-center justify-center text-2xl ${getNotificationColor(
                        notification.type
                      )}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{notification.title}</h3>
                            {!notification.read && (
                              <Badge variant="default" className="rounded-full size-2 p-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDate(notification.createdAt, "MMM d, yyyy")} at{" "}
                            {formatDate(notification.createdAt, "h:mm a")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => markAsRead(notification.id)}
                              className="rounded-[18px]"
                            >
                              <Check className="size-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNotification(notification.id)}
                            className="rounded-[18px]"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      {notification.link && (
                        <Link href={notification.link}>
                          <Button variant="link" className="p-0 h-auto text-sm">
                            View details →
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationsPageLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-4xl mx-auto px-3 lg:px-6 py-8 lg:py-12 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="rounded-[18px] border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

