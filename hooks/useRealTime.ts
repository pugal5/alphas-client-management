'use client';

import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export function useRealTime(event: string, callback: (data: any) => void) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  }, [socket, event, callback]);
}

