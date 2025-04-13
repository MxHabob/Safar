"use client"

import { useState } from "react"
import { useRealtimeNotifications } from "@/redux/hooks/realtime/use-realtime-notifications"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useRealtimeNotifications()

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto z-50 shadow-lg">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="font-medium">Notifications</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>

          <div className="divide-y">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? "bg-blue-50" : ""}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{notification.type}</div>
                    <div className="text-xs text-gray-500">{new Date(notification.created_at).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-sm">{notification.message}</div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
