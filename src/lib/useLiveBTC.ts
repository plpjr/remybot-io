"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface PriceTick {
  price: number;
  timestamp: number;
  volume: number;
}

interface UseLiveBTCReturn {
  prices: PriceTick[];
  currentPrice: number | null;
  connected: boolean;
  tickCount: number;
}

const MAX_WINDOW = 500;
const WS_URL = "wss://ws-feed.exchange.coinbase.com";

export function useLiveBTC(): UseLiveBTCReturn {
  const [prices, setPrices] = useState<PriceTick[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [tickCount, setTickCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const pricesRef = useRef<PriceTick[]>([]);
  const tickCountRef = useRef(0);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setConnected(true);
        retryRef.current = 0;

        ws.send(JSON.stringify({
          type: "subscribe",
          product_ids: ["BTC-USD"],
          channels: ["ticker"],
        }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "ticker") return;

          const price = parseFloat(data.price);
          const volume = parseFloat(data.volume_24h || "0");
          const timestamp = data.time ? new Date(data.time).getTime() : Date.now();

          if (isNaN(price)) return;

          const tick: PriceTick = { price, timestamp, volume };

          // Update refs immediately
          const updated = [...pricesRef.current, tick];
          if (updated.length > MAX_WINDOW) updated.splice(0, updated.length - MAX_WINDOW);
          pricesRef.current = updated;
          tickCountRef.current += 1;

          // Update state
          setCurrentPrice(price);
          setPrices([...updated]);
          setTickCount(tickCountRef.current);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        scheduleReconnect();
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        ws.close();
      };
    } catch {
      scheduleReconnect();
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
    retryRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { prices, currentPrice, connected, tickCount };
}
