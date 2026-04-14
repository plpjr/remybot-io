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
const REST_POLL_MS = 3_000;
// Use our own proxy — Brave Shields blocks direct Coinbase requests
const REST_URL = "/api/btc-price";

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
  const restPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsConnectedRef = useRef(false);
  const connectRef = useRef<() => void>(() => {});

  // Helper: push a new tick into the price buffer and update all state
  function pushTick(price: number, volume: number, timestamp: number) {
    const tick: PriceTick = { price, timestamp, volume };
    const updated = [...pricesRef.current, tick];
    if (updated.length > MAX_WINDOW) updated.splice(0, updated.length - MAX_WINDOW);
    pricesRef.current = updated;
    tickCountRef.current += 1;

    setSpotPrice(price);
    setCurrentPrice(price);
    setPrices([...updated]);
    setTickCount(tickCountRef.current);
  }

  // REST fallback: uses our own /api/btc-price proxy (same origin = never blocked by Brave)
  function pollSpotREST() {
    if (!mountedRef.current || wsConnectedRef.current) return;
    fetch(REST_URL)
      .then((res) => {
        if (!res.ok) {
          console.warn(`[useLiveBTC] REST proxy returned ${res.status}`);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data || !mountedRef.current) return;
        const price = typeof data.price === "number" ? data.price : parseFloat(data.price);
        if (isNaN(price)) return;
        pushTick(price, 0, Date.now());
        setConnected(true);
        if (data.source === "futures") {
          setFuturesPrice(price);
          setSource("futures");
        } else {
          setSource("spot");
        }
      })
      .catch((err) => {
        console.warn("[useLiveBTC] REST proxy failed", err);
      });
  }

  // Schedule reconnect with exponential backoff
  function scheduleReconnect() {
    if (!mountedRef.current) return;
    const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
    retryRef.current += 1;
    retryTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connectRef.current();
    }, delay);
  }

  // WebSocket connection
  function connect() {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setConnected(true);
        retryRef.current = 0;
        wsConnectedRef.current = true;

        // Stop REST polling since WS is working
        if (restPollRef.current) {
          clearInterval(restPollRef.current);
          restPollRef.current = null;
        }

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
          pushTick(price, volume, timestamp);
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        console.warn("[useLiveBTC] WebSocket closed, will reconnect");
        setConnected(false);
        wsConnectedRef.current = false;

        // Restart REST polling as fallback
        if (!restPollRef.current && mountedRef.current) {
          restPollRef.current = setInterval(pollSpotREST, REST_POLL_MS);
        }

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
  }

  // Keep connect ref up to date for scheduleReconnect
  connectRef.current = connect;

  // Polling for futures price via /api/btc-price
  const fetchFuturesPrice = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      const res = await fetch("/api/btc-price");
      if (!res.ok) {
        console.warn(`[useLiveBTC] /api/btc-price returned ${res.status}`);
        return;
      }
      const data = await res.json();
      if (data.error) {
        console.warn(`[useLiveBTC] /api/btc-price error: ${data.error}`, data.details);
        return;
      }
      if (!data.price || typeof data.price !== "number") {
        console.warn("[useLiveBTC] /api/btc-price returned no valid price", data);
        return;
      }


      if (data.source === "futures") {
        setFuturesPrice(data.price);
        setCurrentPrice(data.price);
        setSource("futures");
      } else {
        // Spot fallback from server -- use it if we have nothing
        setCurrentPrice((prev) => prev ?? data.price);
        setSource("spot");
      }
    } catch (err) {
      console.error("[useLiveBTC] /api/btc-price fetch failed", err);
    }
  }, []);

  // Lifecycle: start everything on mount, clean up on unmount
  useEffect(() => {
    mountedRef.current = true;

    // 1. Start WebSocket
    connect();

    // 2. Start futures price polling via /api/btc-price
    fetchFuturesPrice();
    pollTimerRef.current = setInterval(fetchFuturesPrice, FUTURES_POLL_MS);

    // 3. Start REST polling immediately as backup
    //    (will self-skip if WS is connected via wsConnectedRef check)
    pollSpotREST();
    restPollRef.current = setInterval(pollSpotREST, REST_POLL_MS);

    return () => {
      mountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (restPollRef.current) clearInterval(restPollRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { prices, currentPrice, futuresPrice, spotPrice, connected, tickCount, source };
}
