"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"
import { NotificationItem } from "../ui/notification-item"

export function NotificationsCard() {
  const notifications = [
    {
      title: "Booking Update",
      description: "Your booking has been created and is pending confirmation.",
      time: "2 hours ago",
    },
    {
      title: "Booking Update",
      description: "Your booking has been created and is pending confirmation.",
      time: "3 hours ago",
    },
    {
      title: "Booking Update",
      description: "Your booking has been created and is pending confirmation.",
      time: "5 hours ago",
    },
  ]

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
              title={notification.title}
              description={notification.description}
              time={notification.time}
            />
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="ghost" size="sm" className="w-full text-xs">
          View all notifications
        </Button>
      </CardFooter>
    </Card>
  )
}
