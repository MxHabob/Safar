import {
  WebSocketMessage,
  WebSocketEventHandlers,
  InitialDataPayload,
  BookingUpdatePayload,
  NewMessagePayload,
  NewNotificationPayload,
  ErrorPayload
} from '@/redux/types/real-time';

class RealTimeService {
  private socket: WebSocket | null = null;
  private handlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private shouldReconnect = true;
  private accessToken: string | null = null;

  constructor(private url: string) {
    this.accessToken = localStorage.getItem('access');
  }

  connect(handlers: WebSocketEventHandlers = {}) {
    this.handlers = handlers;
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect() {
    if (this.socket) {
      this.socket.close();
    }

    this.socket = new WebSocket(`${this.url}?token=${this.accessToken}`);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.handlers.onConnect?.();
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this._handleMessage(message);
      } catch (error) {
        console.error('WebSocket error occurred:', error);
        this.handlers.onError?.({ message: 'Failed to parse WebSocket message' });
      }
    };

    this.socket.onclose = () => {
      this.handlers.onDisconnect?.();
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this._connect();
        }, this.reconnectDelay);
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error occurred:', error);
      this.handlers.onError?.({ message: 'WebSocket error occurred' });
    };
  }

  private _handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'initial_data':
        this.handlers.onInitialData?.(message.payload as InitialDataPayload);
        break;
      case 'booking_update':
        this.handlers.onBookingUpdate?.(message.payload as BookingUpdatePayload);
        break;
      case 'new_message':
        this.handlers.onNewMessage?.(message.payload as NewMessagePayload);
        break;
      case 'new_notification':
        this.handlers.onNewNotification?.(message.payload as NewNotificationPayload);
        break;
      case 'error':
        this.handlers.onError?.(message.payload as ErrorPayload);
        break;
      default:
        this.handlers.onError?.({ message: `Unknown message type: ${message.type}` });
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    this.socket?.close();
  }

  markMessageAsRead(messageId: string) {
    this._sendAction('mark_message_read', { message_id: messageId });
  }

  markNotificationAsRead(notificationId: string) {
    this._sendAction('mark_notification_read', { notification_id: notificationId });
  }

  private _sendAction(action: string, payload: unknown) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({
        action,
        payload
      }));
    } else {
      this.handlers.onError?.({ message: 'WebSocket is not connected' });
    }
  }
}

// Create a singleton instance
const realTimeService = new RealTimeService(
  process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/safar/'
);

export default realTimeService;