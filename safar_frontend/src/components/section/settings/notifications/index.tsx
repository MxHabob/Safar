"use client"

import { useState } from "react"
import { Bell, Check, CreditCard, Filter, MessageSquare, Percent, Search, ShoppingCart, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Notification } from "@/types"

// Sample data - replace with your actual data fetching logic
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    created_at: "2023-04-15T10:30:00Z",
    updated_at: "2023-04-15T10:30:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    type: "Booking Update",
    message: "Your booking at Sunset Beach Resort has been confirmed. Check-in is on May 10th at 3:00 PM.",
    is_read: false,
  },
  {
    id: "2",
    created_at: "2023-04-14T15:45:00Z",
    updated_at: "2023-04-14T15:45:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    type: "Payment",
    message: "Your payment of $350 for Sunset Beach Resort has been processed successfully.",
    is_read: true,
  },
  {
    id: "3",
    created_at: "2023-04-13T09:20:00Z",
    updated_at: "2023-04-13T09:20:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    type: "Discount",
    message: "Special offer: Use code SUMMER25 for 25% off your next booking. Valid until June 30th.",
    is_read: false,
  },
  {
    id: "4",
    created_at: "2023-04-12T14:10:00Z",
    updated_at: "2023-04-12T14:10:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    type: "Message",
    message:
      "New message from Sunset Beach Resort: 'We're looking forward to your stay! Please let us know if you have any special requests.'",
    is_read: true,
  },
  {
    id: "5",
    created_at: "2023-04-11T11:05:00Z",
    updated_at: "2023-04-11T11:05:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    type: "General",
    message: "Welcome to our new app! Explore destinations, book experiences, and manage your trips all in one place.",
    is_read: true,
  },
  {
    id: "6",
    created_at: "2023-04-10T16:30:00Z",
    updated_at: "2023-04-10T16:30:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    type: "Booking Update",
    message:
      "Your flight to Los Angeles (SW123) is scheduled for departure on June 15th at 8:00 AM. Please arrive at the airport 2 hours before departure.",
    is_read: false,
  },
  {
    id: "7",
    created_at: "2023-04-09T13:15:00Z",
    updated_at: "2023-04-09T13:15:00Z",
    is_deleted: false,
    user: {
      id: "user1",
      email: "user@example.com",
      is_active: true,
      created_at: "2022-01-01T00:00:00Z",
      updated_at: "2022-01-01T00:00:00Z",
      is_deleted: false,
    },
    type: "Payment",
    message: "Your payment of $299 for flight SW123 to Los Angeles has been processed successfully.",
    is_read: true,
  },
]

type NotificationType = "All" | "Booking Update" | "Payment" | "Discount" | "Message" | "General"
type ReadStatus = "All" | "Read" | "Unread"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS)
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<NotificationType>("All")
  const [readFilter, setReadFilter] = useState<ReadStatus>("All")

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, is_read: true } : notification)),
    )
  }

  const markAsUnread = (id: string) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id ? { ...notification, is_read: false } : notification,
      ),
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, is_read: true })))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const filteredNotifications = notifications.filter((notification) => {
    // Apply search filter
    if (searchQuery && !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    // Apply type filter
    if (typeFilter !== "All" && notification.type !== typeFilter) {
      return false
    }

    // Apply read status filter
    if (readFilter === "Read" && !notification.is_read) {
      return false
    }

    if (readFilter === "Unread" && notification.is_read) {
      return false
    }

    return true
  })

  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            You have {unreadCount} unread {unreadCount === 1 ? "notification" : "notifications"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
          <Button variant="outline" size="sm" onClick={clearAllNotifications} disabled={notifications.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Type: {typeFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem checked={typeFilter === "All"} onCheckedChange={() => setTypeFilter("All")}>
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Booking Update"}
                onCheckedChange={() => setTypeFilter("Booking Update")}
              >
                Booking Updates
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Payment"}
                onCheckedChange={() => setTypeFilter("Payment")}
              >
                Payments
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Discount"}
                onCheckedChange={() => setTypeFilter("Discount")}
              >
                Discounts
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "Message"}
                onCheckedChange={() => setTypeFilter("Message")}
              >
                Messages
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={typeFilter === "General"}
                onCheckedChange={() => setTypeFilter("General")}
              >
                General
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex-shrink-0">
                <Filter className="h-4 w-4 mr-2" />
                Status: {readFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuCheckboxItem checked={readFilter === "All"} onCheckedChange={() => setReadFilter("All")}>
                All
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={readFilter === "Read"} onCheckedChange={() => setReadFilter("Read")}>
                Read
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={readFilter === "Unread"}
                onCheckedChange={() => setReadFilter("Unread")}
              >
                Unread
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Bell className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No notifications found</h2>
          <p className="text-muted-foreground text-center max-w-md">
            {notifications.length === 0
              ? "You don't have any notifications yet. We'll notify you of important updates and offers."
              : "No notifications match your current filters. Try adjusting your search or filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => markAsRead(notification.id)}
              onMarkAsUnread={() => markAsUnread(notification.id)}
              onDelete={() => deleteNotification(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: () => void
  onMarkAsUnread: () => void
  onDelete: () => void
}

function NotificationItem({ notification, onMarkAsRead, onMarkAsUnread, onDelete }: NotificationItemProps) {
  const formattedDate = new Date(notification.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "Booking Update":
        return <ShoppingCart className="h-5 w-5 text-emerald-500" />
      case "Payment":
        return <CreditCard className="h-5 w-5 text-violet-500" />
      case "Discount":
        return <Percent className="h-5 w-5 text-amber-500" />
      case "Message":
        return <MessageSquare className="h-5 w-5 text-sky-500" />
      case "General":
        return <Bell className="h-5 w-5 text-slate-500" />
      default:
        return <Bell className="h-5 w-5 text-slate-500" />
    }
  }

  const getNotificationBadge = () => {
    switch (notification.type) {
      case "Booking Update":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Booking</Badge>
      case "Payment":
        return <Badge className="bg-violet-500 hover:bg-violet-600">Payment</Badge>
      case "Discount":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Discount</Badge>
      case "Message":
        return <Badge className="bg-sky-500 hover:bg-sky-600">Message</Badge>
      case "General":
        return <Badge variant="outline">General</Badge>
      default:
        return <Badge variant="outline">General</Badge>
    }
  }

  return (
    <Card className={`transition-colors ${notification.is_read ? "bg-background" : "bg-muted/30"}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0 mt-1">{getNotificationIcon()}</div>
          <div className="flex-grow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {getNotificationBadge()}
                {!notification.is_read && <span className="h-2 w-2 rounded-full bg-rose-500"></span>}
              </div>
              <span className="text-sm text-muted-foreground">{formattedDate}</span>
            </div>
            <p className="text-sm sm:text-base mb-4">{notification.message}</p>
            <div className="flex flex-wrap gap-2">
              {notification.is_read ? (
                <Button variant="outline" size="sm" onClick={onMarkAsUnread}>
                  Mark as unread
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onMarkAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as read
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

