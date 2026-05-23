import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { fetchRadarDashboard, fetchRadarSymbol } from '../api/radarApi';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const DEFAULT_SYMBOLS = ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'INFY', 'TCS', 'ICICIBANK', 'SBIN', 'ITC', 'LT'];

export const useRadarTerminal = (initialSymbol = 'RELIANCE') => {
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [dashboard, setDashboard] = useState(null);
  const [symbolResearch, setSymbolResearch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [ticks, setTicks] = useState({});
  const [market, setMarket] = useState(null);
  const socketRef = useRef(null);

  const symbols = useMemo(() => {
    if (dashboard?.watchlist?.length) {
      return dashboard.watchlist.map((item) => item.symbol);
    }
    return DEFAULT_SYMBOLS;
  }, [dashboard]);

  const refreshDashboard = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await fetchRadarDashboard({ symbols: DEFAULT_SYMBOLS, interval: '5m' });
      setDashboard(data);
      setMarket(data?.market || null);
      if (!symbolResearch) {
        setSymbolResearch(data?.chart || null);
        if (data?.chart?.symbol) setSelectedSymbol(data.chart.symbol);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [symbolResearch]);

  const selectSymbol = useCallback(async (symbol) => {
    const normalized = String(symbol || '').toUpperCase();
    setSelectedSymbol(normalized);
    const data = await fetchRadarSymbol(normalized, '5m');
    setSymbolResearch(data);
  }, []);

  useEffect(() => {
    refreshDashboard(false);
    const id = setInterval(() => refreshDashboard(true), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [refreshDashboard]);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'], autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('radar:subscribe', { symbols });
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('radar:status', (payload) => setMarket(payload.market));
    socket.on('radar:tick', (payload) => {
      setMarket(payload.market);
      setTicks((prev) => {
        const next = { ...prev };
        payload.ticks?.forEach((tick) => {
          next[tick.symbol] = tick;
        });
        return next;
      });
      setSymbolResearch((prev) => {
        const selectedTick = payload.ticks?.find((tick) => tick.symbol === selectedSymbol);
        if (!prev || !selectedTick) return prev;
        const existing = prev.candles || [];
        const last = existing.at(-1);
        const candle = selectedTick.candle;
        const candles = last?.time === candle.time
          ? [...existing.slice(0, -1), candle]
          : [...existing.slice(-219), candle];
        return {
          ...prev,
          candles,
          quote: { ...prev.quote, ...selectedTick.quote, price: selectedTick.price },
          indicators: { ...prev.indicators, snapshot: selectedTick.indicators },
          market: payload.market,
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedSymbol, symbols.join('|')]);

  useEffect(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('radar:subscribe', { symbols });
    }
  }, [symbols]);

  return {
    dashboard,
    symbolResearch,
    selectedSymbol,
    selectSymbol,
    isLoading,
    isConnected,
    ticks,
    market,
    refreshDashboard,
  };
};

export default useRadarTerminal;
