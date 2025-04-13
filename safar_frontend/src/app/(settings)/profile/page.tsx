"use client"

import { useEffect } from "react"
import { useWebSocket } from "@/redux/hooks/realtime/use-websocket"
import NotificationCenter from "@/components/globals/notification-center"
import BookingUpdates from "@/components/booking-updates"

export default function Dashboard() {
  const { status, connect } = useWebSocket()

  // Ensure WebSocket is connected when dashboard loads
  useEffect(() => {
    if (status !== "open") {
      connect()
    }
  }, [status, connect])

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <div className="text-sm">
            WebSocket:{" "}
            <span className={`font-medium ${status === "open" ? "text-green-500" : "text-red-500"}`}>
              {status === "open" ? "Connected" : status}
            </span>
          </div>
          <NotificationCenter />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BookingUpdates />

        <div className="space-y-6">{/* Other dashboard components can go here */}</div>
      </div>
    </div>
  )
}
