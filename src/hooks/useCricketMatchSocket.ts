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
  betUpdate: any | null;
  betHistoryData: any[];
}

function useCricketMatchSocket(gameId: string | undefined): UseCricketMatchSocketReturn {
  const [matchData, setMatchData] = useState<MatchUpdateData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isDeclared, setIsDeclared] = useState<boolean>(false);
  const [betUpdate, setBetUpdate] = useState<any | null>(null);
  const [betHistoryData, setBetHistoryData] = useState<any[]>([]);
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

      socket.emit('match:bets:request', {
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

    // 💥 NEW BETS REAL-TIME
    socket.on('bet:update', (data: any) => {
      console.log('✅ NEW BET UPDATE:', data);
      setBetUpdate(data);

      setBetHistoryData((prev) => {
        const newData = [...prev];
        const betIdToMatch = data._id || data.id;
        const existingIndex = newData.findIndex(b => b._id === betIdToMatch || b.id === betIdToMatch);
        if (existingIndex !== -1) {
          newData[existingIndex] = { ...newData[existingIndex], ...data };
        } else {
          newData.unshift(data);
        }
        return newData;
      });
    });

    socket.on('match:bets:response', (data: any) => {
      console.log('✅ BET HISTORY RESPONSE:', data);
      if (data && Array.isArray(data.data)) {
        setBetHistoryData(data.data);
      }
    });

    socket.on('match:bets:refresh', () => {
      console.log('✅ REFRESH BETS REQUESTED');
      if (gameId) {
        socket.emit('match:bets:request', { matchId: gameId });
      }
    });

    // 🔴 DISCONNECT ERROR
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
    betUpdate,
    betHistoryData,
  };
}

export { useCricketMatchSocket };