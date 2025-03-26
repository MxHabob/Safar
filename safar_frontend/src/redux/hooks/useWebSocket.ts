import { useEffect } from 'react';
import { webSocketService } from '../services/real-time';
import { useTypedSelector } from './useTypedSelector';
import { selectAuthToken } from '../features/auth/authSlice';

export const useWebSocket = () => {
  const token = useTypedSelector(selectAuthToken);

  useEffect(() => {
    if (token) {
      webSocketService.connect().catch(console.error);
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      webSocketService.updateToken(token);
    }
  }, [token]);

  return webSocketService;
};