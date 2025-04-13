"use client"

import { useCallback, useEffect, useState } from "react"
import { useWebSocket } from "./use-websocket"

interface PresenceUser {
  id: string
  isOnline: boolean
  lastSeen?: string
}

export function usePresence() {
  const { status, send } = useWebSocket()
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser>>({})

  // Update presence status when WebSocket connection changes
  useEffect(() => {
    if (status === "open") {
      // Announce presence when connected
      send("presence_update", { status: "online" })

      // Set up interval to periodically update presence
      const interval = setInterval(() => {
        send("presence_update", { status: "online" })
      }, 60000) // Every minute

      return () => {
        clearInterval(interval)
        // Announce offline status when component unmounts
        send("presence_update", { status: "offline" })
      }
    }
  }, [status, send])

  // Handle presence updates from the server
  useEffect(() => {
    // This would be implemented in the WebSocketService
    // to dispatch presence updates to the store

    // For now, we'll simulate it with a mock implementation
    const mockUsers: Record<string, PresenceUser> = {
      "user-1": { id: "user-1", isOnline: true },
      "user-2": { id: "user-2", isOnline: false, lastSeen: new Date().toISOString() },
    }

    setOnlineUsers(mockUsers)
  }, [])

  // Check if a specific user is online
  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers[userId]?.isOnline || false
    },
    [onlineUsers],
  )

  // Get the last seen time for a user
  const getUserLastSeen = useCallback(
    (userId: string) => {
      return onlineUsers[userId]?.lastSeen
    },
    [onlineUsers],
  )

  return {
    onlineUsers,
    isUserOnline,
    getUserLastSeen,
  }
}
