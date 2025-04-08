import {
  WebSocketMessage,
  WebSocketEventHandlers,
  InitialDataPayload,
  BookingUpdatePayload,
  NewMessagePayload,
  NewNotificationPayload,
  ErrorPayload,
  WebSocketMessageType
} from '@/redux/types/real-time';

class RealTimeService {
  private socket: WebSocket | null = null;
  private handlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 3000;
  private shouldReconnect = true;
  private messageQueue: Array<{action: string, payload: unknown}> = [];
  private pingInterval: NodeJS.Timeout | null = null;
  private readonly PING_INTERVAL = 30000;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private lastActivityTimestamp = 0;

  constructor(private readonly url: string) {}

  public connect(handlers: WebSocketEventHandlers = {}): void {
    if (this.connectionState === 'connected') {
      this.disconnect();
    }
    
    this.handlers = handlers;
    this.shouldReconnect = true;
    this._connect();
  }

  private _connect(): void {
    this.connectionState = 'connecting';
    this.socket = new WebSocket(this.url);
    
    this.socket.onopen = this._handleOpen.bind(this);
    this.socket.onmessage = this._handleMessage.bind(this);
    this.socket.onclose = this._handleClose.bind(this);
    this.socket.onerror = this._handleError.bind(this);
  }

  private _handleOpen(): void {
    this.reconnectAttempts = 0;
    this.connectionState = 'connected';
    this.lastActivityTimestamp = Date.now();
    this._startPing();
    this._flushMessageQueue();
    this.handlers.onConnect?.();
  }

  private _handleMessage(event: MessageEvent): void {
    try {
      this.lastActivityTimestamp = Date.now();
      const message: WebSocketMessage = JSON.parse(event.data);
      
      if (message.type === 'pong') return;
      
      this._routeMessage(message);
    } catch (error) {
      this._handleError({
        message: 'Failed to parse message',
        code: 'VALIDATION',
        retryable: false
      });
    }
  }

  private _routeMessage(message: WebSocketMessage): void {
    const typeHandlers: Record<WebSocketMessageType, () => void> = {
      initial_data: () => this.handlers.onInitialData?.(message.payload as InitialDataPayload),
      booking_update: () => this.handlers.onBookingUpdate?.(message.payload as BookingUpdatePayload),
      new_message: () => this.handlers.onNewMessage?.(message.payload as NewMessagePayload),
      new_notification: () => this.handlers.onNewNotification?.(message.payload as NewNotificationPayload),
      error: () => this.handlers.onError?.(message.payload as ErrorPayload),
    };

    typeHandlers[message.type]?.() || this.handlers.onError?.({
      message: `Unknown message type: ${message.type}`,
      code: 'VALIDATION',
      retryable: false
    });
  }

  private _handleClose(): void {
    this.connectionState = 'disconnected';
    this._cleanup();
    this.handlers.onDisconnect?.();
    
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.getReconnectDelay();
      setTimeout(() => {
        this.reconnectAttempts++;
        this._connect();
      }, delay);
    }
  }

  private _handleError(error: ErrorPayload | Event): void {
    const errorPayload: ErrorPayload = {
      message: error instanceof Event ? 'WebSocket error occurred' : error.message,
      code: 'NETWORK',
      retryable: true
    };
    this.handlers.onError?.(errorPayload);
  }

  private getReconnectDelay(): number {
    return Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      30000
    );
  }

  private _startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        // Close if no activity in 2 ping intervals
        if (Date.now() - this.lastActivityTimestamp > this.PING_INTERVAL * 2) {
          this.socket.close();
          return;
        }
        this.socket.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.PING_INTERVAL);
  }

  private _flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        this.socket.send(JSON.stringify(message));
      }
    }
  }

  private _sendAction(action: string, payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, payload }));
    } else {
      this.messageQueue.push({ action, payload });
      this.handlers.onError?.({
        message: 'Message queued - connection not ready',
        code: 'NETWORK',
        retryable: true
      });
    }
  }

  private _cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this._cleanup();
    this.socket?.close();
    this.messageQueue = [];
  }

  public markMessageAsRead(messageId: string): void {
    this._sendAction('mark_message_read', { message_id: messageId });
  }

  public markNotificationAsRead(notificationId: string): void {
    this._sendAction('mark_notification_read', { notification_id: notificationId });
  }

  public getConnectionState(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionState;
  }
}

// Singleton instance
const realTimeService = new RealTimeService(
  process.env.NEXT_PUBLIC_WS_URL || 'wss://your-backend.com/ws'
);

export default realTimeService;