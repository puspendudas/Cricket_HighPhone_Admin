import type { Socket } from 'socket.io-client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

const SOCKET_URL = 'https://server.testingexch.com';

interface UseCasinoSocketReturn {
  oddsData: any | null;
  resultsData: any[];
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
}

export function useCasinoSocket(gtype: string | undefined): UseCasinoSocketReturn {
  const [oddsData, setOddsData] = useState<any | null>(null);
  const [resultsData, setResultsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  const socketRef = useRef<Socket | null>(null);

  const getToken = useCallback(() => sessionStorage.getItem(STORAGE_KEY), []);

  useEffect(() => {
    if (!gtype) return () => {};

    const token = getToken();

    if (!token) {
      setError(new Error('No JWT token available'));
      setIsLoading(false);
      return () => {};
    }

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setIsLoading(false);
      setError(null);
      socket.emit('casino:join', { gtype });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (err: Error) => {
      setError(err);
      setIsLoading(false);
    });

    socket.on('casino:odds', (data: any) => {
      let actualData = data;
      while (actualData && actualData.data && !actualData.sub) {
        actualData = actualData.data;
      }
      setOddsData(actualData);
      setIsLoading(false);
    });

    socket.on('casino:results', (data: any) => {
      const extractArray = (obj: any): any[] | null => {
        if (Array.isArray(obj)) return obj;
        if (obj && typeof obj === 'object') {
          const keys = Object.keys(obj);
          for (let i = 0; i < keys.length; i += 1) {
            const res = extractArray(obj[keys[i]]);
            if (res) return res;
          }
        }
        return null;
      };
      
      const actualData = extractArray(data) || [];
      setResultsData(actualData);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('casino:leave', { gtype });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [gtype, getToken]);

  return { oddsData, resultsData, isLoading, error, isConnected };
}
