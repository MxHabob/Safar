"use client"

import { useCallback, useMemo } from "react"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/core/store"
import { markNotificationRead, markAllNotificationsRead } from "@/core/features/realtime/realtime-slice"
import { useWebSocket } from "./use-websocket"
import type { Notification } from "@/core/types"

export function useRealtimeNotifications() {
  const dispatch = useDispatch()
  const { send } = useWebSocket()
  const notifications = useSelector((state: RootState) => state.realtime.notifications)

  const notificationsList = useMemo(() => {
    return Object.values(notifications).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [notifications])

  const unreadCount = useMemo(() => {
    return notificationsList.filter((notification) => !notification.is_read).length
  }, [notificationsList])

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

  const markAsRead = useCallback(
    (notificationId: string) => {
      send("mark_notification_read", { notification_id: notificationId })
      dispatch(markNotificationRead(notificationId))
    },
    [dispatch, send],
  )

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
