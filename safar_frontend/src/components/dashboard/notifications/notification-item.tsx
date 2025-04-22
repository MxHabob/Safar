"use client";

import { Bell, Check, CreditCard, MessageSquare, Percent, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NotificationItemProps } from "./types";


export function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) {
  const formattedDate = new Date(notification.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "Booking Update":
        return <CreditCard className="h-5 w-5 text-emerald-500" />;
      case "Payment":
        return <CreditCard className="h-5 w-5 text-violet-500" />;
      case "Discount":
        return <Percent className="h-5 w-5 text-amber-500" />;
      case "Message":
        return <MessageSquare className="h-5 w-5 text-sky-500" />;
      case "General":
        return <Bell className="h-5 w-5 text-slate-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getNotificationBadge = () => {
    switch (notification.type) {
      case "Booking Update":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Booking</Badge>;
      case "Payment":
        return <Badge className="bg-violet-500 hover:bg-violet-600">Payment</Badge>;
      case "Discount":
        return <Badge className="bg-amber-500 hover:bg-amber-600">Discount</Badge>;
      case "Message":
        return <Badge className="bg-sky-500 hover:bg-sky-600">Message</Badge>;
      case "General":
        return <Badge variant="outline">General</Badge>;
      default:
        return <Badge variant="outline">General</Badge>;
    }
  };

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
                <Button variant="outline" size="sm" >
                <Check className="h-4 w-4 mr-2" />
                    Read
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onMarkAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as read
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-destructive hover:text-destructive" 
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}