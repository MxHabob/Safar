// real-time/hook.ts
import { useEffect, useState, useCallback } from 'react';
import RealTimeService from '@/redux/services/real-time';
import { WebSocketEventHandlers, ConnectionState } from '@/redux/types/real-time';

export const useRealTime = (handlers: WebSocketEventHandlers = {}) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [unreadCounts, setUnreadCounts] = useState({ messages: 0, notifications: 0 });
  const [connectionId, setConnectionId] = useState<string | null>(null);

  // Memoize the realTimeService instance
  const realTimeService = useState(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/safar/';
    return new RealTimeService(wsUrl);
  })[0];

  // Enhanced handlers with state management
  const enhancedHandlers: WebSocketEventHandlers = {
    ...handlers,
    onNewMessage: (payload) => {
      setUnreadCounts(prev => ({ ...prev, messages: prev.messages + 1 }));
      handlers.onNewMessage?.(payload);
    },
    onNewNotification: (payload) => {
      setUnreadCounts(prev => ({ ...prev, notifications: prev.notifications + 1 }));
      handlers.onNewNotification?.(payload);
    },
    onConnect: () => {
      setUnreadCounts({ messages: 0, notifications: 0 });
      setConnectionId(realTimeService.getConnectionId());
      handlers.onConnect?.();
    },
    onDisconnect: () => {
      setConnectionId(null);
      handlers.onDisconnect?.();
    },
  };

  // Connection state sync
  useEffect(() => {
    const updateState = () => {
      const newState = realTimeService.getConnectionState();
      setConnectionState(newState);
      
      if (newState === 'connected') {
        setUnreadCounts({ messages: 0, notifications: 0 });
        setConnectionId(realTimeService.getConnectionId());
      } else if (newState === 'disconnected') {
        setConnectionId(null);
      }
    };

    // Initial connection
    realTimeService.connect({
      ...enhancedHandlers,
      onConnect: () => {
        updateState();
        enhancedHandlers.onConnect?.();
      },
      onDisconnect: () => {
        updateState();
        enhancedHandlers.onDisconnect?.();
      },
    });

    // Cleanup on unmount
    return () => {
      realTimeService.disconnect();
    };
  }, [realTimeService]);

  // Action methods
  const markMessageAsRead = useCallback((id: string) => {
    realTimeService.markMessageAsRead(id);
    setUnreadCounts(prev => ({ 
      ...prev, 
      messages: Math.max(0, prev.messages - 1) 
    }));
  }, [realTimeService]);

  const markNotificationAsRead = useCallback((id: string) => {
    realTimeService.markNotificationAsRead(id);
    setUnreadCounts(prev => ({ 
      ...prev, 
      notifications: Math.max(0, prev.notifications - 1) 
    }));
  }, [realTimeService]);

  const markAllNotificationsAsRead = useCallback(() => {
    realTimeService.markAllNotificationsAsRead();
    setUnreadCounts(prev => ({ ...prev, notifications: 0 }));
  }, [realTimeService]);

  const getMoreMessages = useCallback((offset: number, limit: number) => {
    realTimeService.getMoreMessages(offset, limit);
  }, [realTimeService]);

  return {
    connectionState,
    connectionId,
    unreadCounts,
    markMessageAsRead,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getMoreMessages,
    service: realTimeService,
  };
};