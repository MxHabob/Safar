"use client";

import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";

interface NotificationActionsProps {
  unreadCount: number;
  totalCount: number;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

export function NotificationActions({ 
  unreadCount, 
  totalCount,
  onMarkAllAsRead, 
  onClearAll 
}: NotificationActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onMarkAllAsRead} 
        disabled={unreadCount === 0}
      >
        <Check className="h-4 w-4 mr-2" />
        Mark all as read
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClearAll} 
        disabled={totalCount === 0}
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Clear all
      </Button>
    </div>
  );
}