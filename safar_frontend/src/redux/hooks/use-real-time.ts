import { useEffect, useState } from 'react';
import realTimeService from '@/redux/services/real-time';
import {
  WebSocketEventHandlers,
} from '@/redux/types/real-time';

export const useRealTime = (handlers: WebSocketEventHandlers = {}) => {
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [unreadCount, setUnreadCount] = useState({ messages: 0, notifications: 0 });

  useEffect(() => {
    const enhancedHandlers: WebSocketEventHandlers = {
      ...handlers,
      onNewMessage: (payload) => {
        setUnreadCount(prev => ({ ...prev, messages: prev.messages + 1 }));
        handlers.onNewMessage?.(payload);
      },
      onNewNotification: (payload) => {
        setUnreadCount(prev => ({ ...prev, notifications: prev.notifications + 1 }));
        handlers.onNewNotification?.(payload);
      },
      onConnect: () => {
        setUnreadCount({ messages: 0, notifications: 0 });
        handlers.onConnect?.();
      },
    };

    const updateState = (state: 'disconnected' | 'connecting' | 'connected') => {
      setConnectionState(state);
      if (state === 'connected') {
        setUnreadCount({ messages: 0, notifications: 0 });
      }
    };

    realTimeService.connect({
      ...enhancedHandlers,
      onConnect: () => {
        updateState('connected');
        enhancedHandlers.onConnect?.();
      },
      onDisconnect: () => {
        updateState('disconnected');
        enhancedHandlers.onDisconnect?.();
      },
    });

    return () => {
      realTimeService.disconnect();
    };
  }, [handlers]);

  return {
    connectionState,
    unreadCount,
    markMessageAsRead: (id: string) => {
      realTimeService.markMessageAsRead(id);
      setUnreadCount(prev => ({ ...prev, messages: Math.max(0, prev.messages - 1) }));
    },
    markNotificationAsRead: (id: string) => {
      realTimeService.markNotificationAsRead(id);
      setUnreadCount(prev => ({ ...prev, notifications: Math.max(0, prev.notifications - 1) }));
    },
    service: realTimeService,
  };
};