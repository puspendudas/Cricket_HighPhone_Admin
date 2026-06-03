import type { Socket } from 'socket.io-client';

import { io } from 'socket.io-client';
import { useRef, useState, useEffect, useCallback } from 'react';

import { STORAGE_KEY } from 'src/auth/context/jwt/constant';

const SOCKET_URL = 'https://server.testingexch.com';

interface MatchUpdateData {
  match?: any;
  [key: string]: any;
}

interface UseCricketMatchSocketReturn {
  matchData: MatchUpdateData | null;
  isLoading: boolean;
  error: Error | null;
  isDeclared: boolean;
}

function useCricketMatchSocket(gameId: string | undefined): UseCricketMatchSocketReturn {
  const [matchData, setMatchData] = useState<MatchUpdateData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDeclared, setIsDeclared] = useState<boolean>(false);
  const socketRef = useRef<Socket | null>(null);

  const getToken = useCallback(() => sessionStorage.getItem(STORAGE_KEY), []);

  useEffect(() => {
    if (!gameId) return;

    const token = getToken();

    if (!token) {
      setError(new Error('No JWT token available'));
      setIsLoading(false);
      return;
    }

    // 🔥 duplicate socket avoid
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SOCKET_URL, {
      path: '/socket.io/',
      transports: ['websocket'],
      auth: {
        token,
      },
    });

    socketRef.current = socket;

    // ✅ CONNECT
    socket.on('connect', () => {
      console.log('✅ Socket Connected:', socket.id);

      socket.emit('match:join', {
        matchId: gameId,
      });
    });

    // 🔥 MAIN FIXED HANDLER
    socket.on('match:update', (...args: any[]) => {
      console.log('🔥 FULL ARGS:', args);

      // ✅ handle both formats
      let payload = args[0];

      if (Array.isArray(payload)) {
        payload = payload[1];
      }

      if (!payload) return;

      // ✅ ensure same structure as API
      const finalData = payload?.match ? payload : { match: payload };

      console.log('✅ FINAL DATA:', finalData);

      setMatchData(finalData);
      setIsLoading(false);
      setError(null);
    });

    // ❌ ERROR
    socket.on('match:error', (err: { reason?: string; message?: string }) => {
      console.log('❌ match:error', err);

      setError(new Error(err?.message || err?.reason || 'Match error occurred'));
      setIsLoading(false);
    });

    // 🏁 DECLARED
    socket.on('match:declared', () => {
      console.log('🏁 match declared');

      setIsDeclared(true);
    });

    // ❌ CONNECT ERROR
    socket.on('connect_error', (err) => {
      console.log('❌ connect_error', err.message);

      setError(new Error(err.message || 'Connection error'));
      setIsLoading(false);
    });

    // ⚠️ DISCONNECT
    socket.on('disconnect', (reason) => {
      console.log('⚠️ disconnected:', reason);
    });

    // 🔍 DEBUG (optional)
    socket.onAny((event, ...args) => {
      console.log('📡 Event:', event, args);
    });

    // eslint-disable-next-line consistent-return
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [gameId, getToken]);

  return {
    matchData,
    isLoading,
    error,
    isDeclared,
  };
}

export { useCricketMatchSocket };