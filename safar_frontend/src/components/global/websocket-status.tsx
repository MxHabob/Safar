"use client"
import { useRealTime } from "@/redux/hooks/use-real-time"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff } from "lucide-react"

export default function WebSocketStatus() {

  // Initialize WebSocket connection with handlers
  const { connectionState, unreadCount } = useRealTime({
    onConnect: () => {
      toast.success("Connected", {
        description: "Real-time connection established",
      })
    },
    onDisconnect: () => {
      // toast.error("Disconnected", {
      //   description: "Real-time connection lost",
      // })
    },
    onError: (error) => {
      toast.error("Connection Error", {
        description: error.message,
      })
    console.error("WebSocket error:", error.message)
    },
    onNewMessage: (data) => {
      toast.info("New Message", {
        description: `From: ${data.sender.first_name}: ${data.message_text.substring(0, 30)}${
          data.message_text.length > 30 ? "..." : ""
        }`,
      })
    },
    onNewNotification: (data) => {
      toast.info("New Notification", {
        description: data.message,
      })
    },
  })

  return (
    <div className="flex items-center gap-2">
      {connectionState === "connected" ? (
        <Badge variant="outline" className="text-green-300 flex items-center gap-1.5">
          <Wifi className="h-3.5 w-3.5" />
          <span>Connected</span>
        </Badge>
      ) : (
        <Badge variant="outline" className="text-red-300 flex items-center gap-1.5">
          <WifiOff className="h-3.5 w-3.5" />
          <span>{connectionState === "connecting" ? "Connecting..." : "Disconnected"}</span>
        </Badge>
      )}

      {connectionState === "connected" && (
        <>
          {unreadCount.messages > 0 && <Badge className="bg-blue-500">{unreadCount.messages}</Badge>}
          {unreadCount.notifications > 0 && <Badge className="bg-amber-500">{unreadCount.notifications}</Badge>}
        </>
      )}
    </div>
  )
}
