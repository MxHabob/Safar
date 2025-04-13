"use client"

import { type ReactNode, useEffect, useState, useCallback } from "react"
import { useSelector } from "react-redux"
import { WebSocketContext, websocketService, type WebSocketStatus } from "@/core/services/websocket-service"
import type { RootState } from "@/core/store"

interface WebSocketProviderProps {
  children: ReactNode
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [status, setStatus] = useState<WebSocketStatus>(websocketService.getStatus())
  const isAuthenticated = useSelector((state: RootState) => !!state.auth.token)

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      websocketService.connect()
    } else {
      websocketService.disconnect()
    }

    // Cleanup on unmount
    return () => {
      websocketService.disconnect()
    }
  }, [isAuthenticated])

  // Listen for status changes
  useEffect(() => {
    const removeListener = websocketService.addStatusListener(setStatus)
    return removeListener
  }, [])

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = {
    status,
    connect: useCallback(() => websocketService.connect(), []),
    disconnect: useCallback(() => websocketService.disconnect(), []),
    send: useCallback((action: string, payload: Record<string, any>) => websocketService.send(action, payload), []),
  }

  return <WebSocketContext.Provider value={contextValue}>{children}</WebSocketContext.Provider>
}
