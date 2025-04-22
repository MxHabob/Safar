"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { NotificationItem } from "../ui/notification-item"
import { useRealtimeNotifications } from "@/core/hooks/realtime/use-realtime-notifications"
import Link from "next/link"

export function NotificationsCard() {
    const { notifications } = useRealtimeNotifications()
    console.log("NotificationsCard notifications", notifications)

  return (
    <Card className="col-span-1 row-span-2">
      <CardHeader className="p-4">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>Upcoming Notifications</span>
          <Badge variant="outline" className="text-xs font-normal">
            New
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-1">
          {notifications.map((notification, index) => (
            <NotificationItem
              key={index}
              icon={<Bell className="h-4 w-4" />}
              type={notification.type}
              message={notification.message}
              updated_at={notification.updated_at}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link href={"/notifications"} className="w-full text-xs">
          View all notifications
        </Link>
      </CardFooter>
    </Card>
  )
}
