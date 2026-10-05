import { useSyncExternalStore } from "react";
import { client } from "./api";

export type Category = "Forex" | "Commodities" | "Crypto" | "Index";
export interface Instrument {
  symbol: string;
  name: string;
  flag: string;
  cat: Category;
  base: number;
  decimals: number;
  vol: number; // per-tick relative volatility
}
export interface Candle { o: number; h: number; l: number; c: number; v: number }

export const INSTRUMENTS: Instrument[] = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", flag: "🇪🇺", cat: "Forex", base: 1.085, decimals: 5, vol: 0.00018 },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", flag: "🇬🇧", cat: "Forex", base: 1.264, decimals: 5, vol: 0.0002 },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", flag: "🇯🇵", cat: "Forex", base: 149.5, decimals: 3, vol: 0.00018 },
  { symbol: "XAU/USD", name: "Gold / US Dollar", flag: "🥇", cat: "Commodities", base: 2650, decimals: 2, vol: 0.00022 },
  { symbol: "BTC/USD", name: "Bitcoin / US Dollar", flag: "₿", cat: "Crypto", base: 67000, decimals: 2, vol: 0.0006 },
  { symbol: "ETH/USD", name: "Ethereum / US Dollar", flag: "Ξ", cat: "Crypto", base: 2600, decimals: 2, vol: 0.0007 },
];

interface Series { price: number; prevClose: number; candles: Candle[]; live: boolean; updatedAt: number }
const series: Record<string, Series> = {};
const listeners = new Set<() => void>();
let version = 0;
let timer: ReturnType<typeof setInterval> | null = null;
let busy = false;
let error = false;

async function refresh() {
  if (busy) return;
  busy = true;
  try {
    const data = await client.market.snapshot();
    for (const q of data) {
      series[q.symbol] = { price: q.price, prevClose: q.prevClose, live: q.live, updatedAt: q.updatedAt, candles: q.candles.map((c) => ({ o: c.o, h: c.h, l: c.l, c: c.c, v: c.v })) };
    }
    error = false;
    version++;
    listeners.forEach((l) => l());
  } catch {
    error = true;
    version++;
    listeners.forEach((l) => l());
  } finally { busy = false; }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  if (!timer) { refresh(); timer = setInterval(refresh, 2500); }
  return () => {
    listeners.delete(cb);
    if (listeners.size === 0 && timer) { clearInterval(timer); timer = null; }
  };
}

export function useMarketTick() {
  return useSyncExternalStore(subscribe, () => version);
}
export const isReady = (symbol?: string) => (symbol ? !!series[symbol] : Object.keys(series).length > 0);
export const marketError = () => error;
export const getInstrument = (symbol: string) => INSTRUMENTS.find((i) => i.symbol === symbol) ?? INSTRUMENTS[1];
export const getPrice = (symbol: string) => series[symbol]?.price ?? 0;
export const getCandles = (symbol: string) => series[symbol]?.candles ?? [];
export const getChangePct = (symbol: string) => { const s = series[symbol]; return s ? ((s.price - s.prevClose) / s.prevClose) * 100 : 0; };
export const getUpdatedAt = (symbol: string) => series[symbol]?.updatedAt ?? 0;
export const getSpread = (ins: Instrument) => (series[ins.symbol]?.price ?? ins.base) * 0.00009;
export const fmtPrice = (symbol: string, p = getPrice(symbol)) => (series[symbol] || p ? p.toFixed(getInstrument(symbol).decimals) : "—");

/** Simple momentum score from real simulated candles (demo signal, not advice). */
export function scan() {
  const rows = INSTRUMENTS.map((ins) => {
    const c = series[ins.symbol]?.candles ?? [];
    if (c.length < 20) return { ins, side: "BUY" as const, score: 0 };
    const avg = (n: number) => c.slice(-n).reduce((a, x) => a + x.c, 0) / n;
    const fast = avg(5), slow = avg(20);
    const strength = ((fast - slow) / slow) / ins.vol / 12;
    return { ins, side: strength >= 0 ? "BUY" as const : "SELL" as const, score: Math.min(98, Math.round(62 + Math.min(Math.abs(strength), 1) * 36)) };
  });
  return rows.sort((a, b) => b.score - a.score)[0];
}
