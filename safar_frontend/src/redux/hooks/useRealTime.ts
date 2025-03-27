import { useEffect, useState } from 'react';
import realTimeService from '@/redux/services/real-time';
import {
  WebSocketEventHandlers,
  InitialDataPayload,
} from '@/redux/types/real-time';

export const useRealTime = (handlers: WebSocketEventHandlers = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [initialData, setInitialData] = useState<InitialDataPayload | null>(null);

  useEffect(() => {
    const enhancedHandlers: WebSocketEventHandlers = {
      ...handlers,
      onInitialData: (data) => {
        setInitialData(data);
        handlers.onInitialData?.(data);
      },
      onConnect: () => {
        setIsConnected(true);
        handlers.onConnect?.();
      },
      onDisconnect: () => {
        setIsConnected(false);
        handlers.onDisconnect?.();
      },
    };

    realTimeService.connect(enhancedHandlers);

    return () => {
      realTimeService.disconnect();
    };
  }, [handlers]);

  return {
    isConnected,
    initialData,
    markMessageAsRead: realTimeService.markMessageAsRead.bind(realTimeService),
    markNotificationAsRead: realTimeService.markNotificationAsRead.bind(realTimeService),
  };
};