"use client"

import { useContext } from "react"
import { WebSocketContext } from "@/redux/services/websocket-service"

export function useWebSocket() {
  const context = useContext(WebSocketContext)

  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }

  return context
}
