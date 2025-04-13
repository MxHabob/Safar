import { createContext } from "react"
import { store } from "@/redux/store"
import {
  addMessage,
  updateBooking,
  addNotification,
  markMessageRead,
  markNotificationRead,
} from "@/redux/features/realtime/realtime-slice"

export type WebSocketStatus = "connecting" | "open" | "closed" | "error"

export interface WebSocketContextType {
  status: WebSocketStatus
  connect: () => void
  disconnect: () => void
  send: (action: string, payload: Record<string, any>) => void
}

export const WebSocketContext = createContext<WebSocketContextType>({
  status: "closed",
  connect: () => {},
  disconnect: () => {},
  send: () => {},
})

export class WebSocketService {
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimeout: NodeJS.Timeout | null = null
  private pingInterval: NodeJS.Timeout | null = null
  private status: WebSocketStatus = "closed"
  private listeners: Set<(status: WebSocketStatus) => void> = new Set()

  constructor(private baseUrl: string) {}

  public getStatus(): WebSocketStatus {
    return this.status
  }

  public addStatusListener(listener: (status: WebSocketStatus) => void): () => void {
    this.listeners.add(listener)
    // Return a function to remove the listener
    return () => {
      this.listeners.delete(listener)
    }
  }

  private updateStatus(newStatus: WebSocketStatus): void {
    this.status = newStatus
    this.listeners.forEach((listener) => listener(newStatus))
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return
    }

    const token = this.getAuthToken()
    if (!token) {
      console.error("No authentication token available")
      return
    }

    this.updateStatus("connecting")

    try {
      // Include token in the WebSocket connection URL
      const url = `${this.baseUrl}?token=${encodeURIComponent(token)}`
      this.socket = new WebSocket(url)

      this.socket.onopen = this.handleOpen.bind(this)
      this.socket.onmessage = this.handleMessage.bind(this)
      this.socket.onclose = this.handleClose.bind(this)
      this.socket.onerror = this.handleError.bind(this)
    } catch (error) {
      console.error("WebSocket connection error:", error)
      this.updateStatus("error")
      this.scheduleReconnect()
    }
  }

  public disconnect(): void {
    this.clearTimers()

    if (this.socket) {
      this.socket.close()
      this.socket = null
    }

    this.updateStatus("closed")
    this.reconnectAttempts = 0
  }

  public send(action: string, payload: Record<string, any> = {}): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn("Cannot send message, WebSocket is not connected")
      return
    }

    try {
      const message = JSON.stringify({
        action,
        payload,
      })
      this.socket.send(message)
    } catch (error) {
      console.error("Error sending WebSocket message:", error)
    }
  }

  private getAuthToken(): string | null {
    const state = store.getState()
    return state.auth.token || null
  }

  private handleOpen(): void {
    console.log("WebSocket connection established")
    this.updateStatus("open")
    this.reconnectAttempts = 0

    // Start ping interval to keep connection alive
    this.startPingInterval()
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data)
      this.processMessage(data)
    } catch (error) {
      console.error("Error parsing WebSocket message:", error)
    }
  }

  private processMessage(data: any): void {
    const { type, payload } = data

    switch (type) {
      case "initial_data":
        this.handleInitialData(payload)
        break
      case "new_message":
        store.dispatch(addMessage(payload))
        break
      case "booking_update":
        store.dispatch(updateBooking(payload))
        break
      case "new_notification":
        store.dispatch(addNotification(payload))
        break
      case "message_marked_read":
        store.dispatch(markMessageRead(payload.message_id))
        break
      case "notification_marked_read":
        store.dispatch(markNotificationRead(payload.notification_id))
        break
      case "all_notifications_marked_read":
        // Handle in the slice
        break
      case "error":
        console.error("WebSocket error:", payload.message)
        break
      case "pong":
        // Connection is alive, nothing to do
        break
      default:
        console.warn("Unknown WebSocket message type:", type)
    }
  }

  private handleInitialData(data: any): void {
    // Process initial data from the server
    // This would typically dispatch multiple actions to populate the store
    if (data.bookings) {
      // Dispatch action to set bookings
    }

    if (data.messages) {
      // Dispatch action to set messages
    }

    if (data.notifications) {
      // Dispatch action to set notifications
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log(`WebSocket connection closed: ${event.code} ${event.reason}`)
    this.updateStatus("closed")
    this.clearTimers()

    // Attempt to reconnect if the closure wasn't intentional
    if (event.code !== 1000) {
      this.scheduleReconnect()
    }
  }

  private handleError(event: Event): void {
    console.error("WebSocket error:", event)
    this.updateStatus("error")

    // The error event is typically followed by a close event
    // so we don't need to schedule a reconnect here
  }

  private startPingInterval(): void {
    this.clearTimers()

    // Send a ping every 30 seconds to keep the connection alive
    this.pingInterval = setInterval(() => {
      this.send("ping", { timestamp: new Date().toISOString() })
    }, 30000)
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("Maximum reconnection attempts reached")
      return
    }

    this.clearTimers()

    // Exponential backoff for reconnection attempts
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    console.log(`Scheduling reconnect in ${delay}ms`)

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, delay)
  }

  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService(
  process.env.NEXT_PUBLIC_WEBSOCKET_URL || "wss://api.example.com/ws",
)
