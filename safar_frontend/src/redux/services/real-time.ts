// real-time/service.ts
import {
  WebSocketMessage,
  WebSocketEventHandlers,
  InitialDataPayload,
  BookingUpdatePayload,
  NewMessagePayload,
  NewNotificationPayload,
  ErrorPayload,
  ConnectionState
} from '@/redux/types/real-time';

const DEFAULT_RECONNECT_MAX_ATTEMPTS = 5;
const DEFAULT_RECONNECT_DELAY = 3000;
const PING_INTERVAL = 30000;
const INACTIVITY_TIMEOUT = PING_INTERVAL * 2;

export class RealTimeService {
  private socket: WebSocket | null = null;
  private handlers: WebSocketEventHandlers = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = DEFAULT_RECONNECT_MAX_ATTEMPTS;
  private baseReconnectDelay = DEFAULT_RECONNECT_DELAY;
  private shouldReconnect = true;
  private messageQueue: Array<{action: string, payload: unknown}> = [];
  private pingInterval: number | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private lastActivityTimestamp = 0;
  private connectionId: string | null = null;

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
    this._updateConnectionState('connecting');
    
    try {
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = this._handleOpen.bind(this);
      this.socket.onmessage = this._handleMessage.bind(this);
      this.socket.onclose = this._handleClose.bind(this);
      this.socket.onerror = this._handleError.bind(this);
    } catch (error) {
      this._handleError({
        message: 'Failed to create WebSocket connection',
        code: 'CONNECTION_FAILED',
        retryable: true
      });
    }
  }

  private _handleOpen(): void {
    this.reconnectAttempts = 0;
    this.connectionId = this._generateConnectionId();
    this._updateConnectionState('connected');
    this.lastActivityTimestamp = Date.now();
    this._startPing();
    this._flushMessageQueue();
    
    this.handlers.onConnect?.();
 
  }

  private _handleMessage(event: MessageEvent): void {
    try {
      this.lastActivityTimestamp = Date.now();
      
      const data = typeof event.data === 'string' 
        ? event.data 
        : new TextDecoder().decode(event.data);
      
      const message: WebSocketMessage = JSON.parse(data);
      
      if (message.type === 'pong') return;
      
      this._routeMessage(message);
    } catch (error) {
      this._handleError({
        message: 'Failed to parse message',
        code: 'MESSAGE_PARSE_ERROR',
        retryable: false,
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private _routeMessage(message: WebSocketMessage): void {
    const typeHandlers = {
      initial_data: () => this.handlers.onInitialData?.(message.payload as InitialDataPayload),
      booking_update: () => this.handlers.onBookingUpdate?.(message.payload as BookingUpdatePayload),
      new_message: () => this.handlers.onNewMessage?.(message.payload as NewMessagePayload),
      new_notification: () => this.handlers.onNewNotification?.(message.payload as NewNotificationPayload),
      error: () => this.handlers.onError?.(message.payload as ErrorPayload),
    };

    const handler = typeHandlers[message.type];
    if (handler) {
      try {
        handler();
      } catch (handlerError) {
        this._handleError({
          message: 'Message handler error',
          code: 'HANDLER_ERROR',
          retryable: false,
          details: handlerError instanceof Error ? handlerError.message : String(handlerError)
        });
      }
    } else {
      this._handleError({
        message: `Unknown message type: ${message.type}`,
        code: 'UNKNOWN_MESSAGE_TYPE',
        retryable: false
      });
    }
  }

  private _handleClose(event: CloseEvent): void {
    this._updateConnectionState('disconnected');
    this._cleanup();
    

    
    this.handlers.onDisconnect?.();
    
    if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
      this._updateConnectionState('reconnecting');
      const delay = this._getReconnectDelay();
      
      
      setTimeout(() => {
        this.reconnectAttempts++;
        this._connect();
      }, delay);
    }
  }

  private _handleError(error: ErrorPayload | Event): void {
    let errorPayload: ErrorPayload;
    
    if (error instanceof Event) {
      errorPayload = {
        message: 'WebSocket error occurred',
        code: 'WEBSOCKET_ERROR',
        retryable: true
      };
    } else {
      errorPayload = error;
    }
    
    
    this.handlers.onError?.(errorPayload);
  }

  private _getReconnectDelay(): number {
    const jitter = Math.random() * 1000;
    return Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts) + jitter,
      30000
    );
  }

  private _startPing(): void {
    this._stopPing();
    
    this.pingInterval = window.setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        // Close if no activity in the timeout period
        if (Date.now() - this.lastActivityTimestamp > INACTIVITY_TIMEOUT) {
        
          this.socket.close();
          return;
        }
        
        try {
          this.socket.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          
        }
      }
    }, PING_INTERVAL);
  }

  private _stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private _flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          this.socket.send(JSON.stringify(message));
        } catch (error) {
         
          // Requeue if failed
          this.messageQueue.unshift(message);
          break;
        }
      }
    }
  }

  private _sendAction(action: string, payload: unknown): void {
    const message = { action, payload };
    
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(message));
      } catch (error) {
       
        this.messageQueue.push(message);
      }
    } else {
      this.messageQueue.push(message);
      
      if (this.connectionState !== 'connecting' && this.connectionState !== 'reconnecting') {
        this.handlers.onError?.({
          message: 'Message queued - connection not ready',
          code: 'QUEUED_MESSAGE',
          retryable: true
        });
      }
    }
  }

  private _cleanup(): void {
    this._stopPing();
    this.socket = null;
  }

  private _updateConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      // Could emit state change event here if needed
    }
  }

  private _generateConnectionId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  public disconnect(): void {
    this.shouldReconnect = false;
    this._cleanup();
    
    if (this.socket) {
      try {
        this.socket.close(1000, 'Client initiated disconnect');
      } catch (error) {
        
      }
    }
    
    this.messageQueue = [];
    this._updateConnectionState('disconnected');
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public getConnectionId(): string | null {
    return this.connectionId;
  }

  // Action methods
  public markMessageAsRead(messageId: string): void {
    this._sendAction('mark_message_read', { message_id: messageId });
  }

  public markNotificationAsRead(notificationId: string): void {
    this._sendAction('mark_notification_read', { notification_id: notificationId });
  }

  public markAllNotificationsAsRead(): void {
    this._sendAction('mark_all_notifications_read', {});
  }

  public getMoreMessages(offset: number, limit: number): void {
    this._sendAction('get_more_messages', { offset, limit });
  }
}