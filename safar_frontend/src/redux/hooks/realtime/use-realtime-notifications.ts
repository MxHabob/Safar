"use client"

import { useCallback, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/redux/store"
import { markNotificationRead, markAllNotificationsRead } from "@/redux/features/realtime/realtime-slice"
import { useWebSocket } from "./use-websocket"
import type { Notification } from "@/redux/types/types"

export function useRealtimeNotifications() {
  const dispatch = useDispatch()
  const { send } = useWebSocket()
  const notifications = useSelector((state: RootState) => state.realtime.notifications)

  // Convert notifications object to array and sort by date
  const notificationsList = useMemo(() => {
    return Object.values(notifications).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [notifications])

  // Get unread notifications count
  const unreadCount = useMemo(() => {
    return notificationsList.filter((notification) => !notification.is_read).length
  }, [notificationsList])

  // Group notifications by type
  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {}

    notificationsList.forEach((notification) => {
      if (!groups[notification.type]) {
        groups[notification.type] = []
      }

      groups[notification.type].push(notification)
    })

    return groups
  }, [notificationsList])

  // Mark a notification as read
  const markAsRead = useCallback(
    (notificationId: string) => {
      send("mark_notification_read", { notification_id: notificationId })
      dispatch(markNotificationRead(notificationId))
    },
    [dispatch, send],
  )

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    send("mark_all_notifications_read", {})
    dispatch(markAllNotificationsRead())
  }, [dispatch, send])

  return {
    notifications: notificationsList,
    unreadCount,
    groupedNotifications,
    markAsRead,
    markAllAsRead,
  }
}
