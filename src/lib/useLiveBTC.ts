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
  futuresPrice: number | null;
  spotPrice: number | null;
  connected: boolean;
  tickCount: number;
  source: "futures" | "spot" | null;
}

const MAX_WINDOW = 500;
const WS_URL = "wss://ws-feed.exchange.coinbase.com";
const FUTURES_POLL_MS = 5_000;

export function useLiveBTC(): UseLiveBTCReturn {
  const [prices, setPrices] = useState<PriceTick[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [futuresPrice, setFuturesPrice] = useState<number | null>(null);
  const [spotPrice, setSpotPrice] = useState<number | null>(null);
  const [source, setSource] = useState<"futures" | "spot" | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const pricesRef = useRef<PriceTick[]>([]);
  const tickCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── WebSocket for real-time spot ticks ────────────────────────────

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
          setSpotPrice(price);
          setCurrentPrice((prev) => {
            // Prefer futures price if available
            return prev !== null && futuresPrice !== null ? prev : price;
          });
          setPrices([...updated]);
          setTickCount(tickCountRef.current);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.warn("[useLiveBTC] WebSocket closed");
        setConnected(false);
        scheduleReconnect();
      };

      ws.onerror = (event) => {
        if (!mountedRef.current) return;
        console.error("[useLiveBTC] WebSocket error", event);
        ws.close();
      };
    } catch (err) {
      console.error("[useLiveBTC] WebSocket connection failed", err);
      scheduleReconnect();
    }
  }, [];

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
    retryRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  // ─── Polling for futures price via API route ───────────────────────

  const fetchFuturesPrice = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch("/api/btc-price");
      if (!res.ok) {
        console.warn(`[useLiveBTC] BTC price API returned ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.error) {
        console.warn(`[useLiveBTC] BTC price API error: ${data.error}`, data.details);
      }
      if (!data.price || typeof data.price !== "number") {
        console.warn("[useLiveBTC] BTC price API returned no valid price");
        return;
      }

      if (data.source === "futures") {
        setFuturesPrice(data.price);
        setCurrentPrice(data.price);
        setSource("futures");
      } else {
        // API returned spot fallback — don't overwrite WS spot, just note source
        setSource("spot");
      }
    } catch (err) {
      console.error("[useLiveBTC] BTC price fetch failed", err);
    }
  }, []);

  // ─── Lifecycle ─────────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    connect();
    fetchFuturesPrice();
    pollTimerRef.current = setInterval(fetchFuturesPrice, FUTURES_POLL_MS);

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [connect, fetchFuturesPrice]);

  return { prices, currentPrice, futuresPrice, spotPrice, connected, tickCount, source };
}
