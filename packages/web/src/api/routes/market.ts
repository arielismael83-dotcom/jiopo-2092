import { base } from "../__core/app";
import { SYMBOLS, pub } from "../lib/deriv";

export interface Candle { t: number; o: number; h: number; l: number; c: number; v: number }
export interface Quote { symbol: string; price: number; prevClose: number; candles: Candle[]; live: boolean; updatedAt: number }

const dayOpen = new Map<string, { at: number; open: number }>();

async function quote(symbol: string): Promise<Quote> {
  const d = SYMBOLS[symbol];
  const r = await pub.call({ ticks_history: d, end: "latest", count: 120, style: "candles", granularity: 60 });
  const candles: Candle[] = (r.candles as any[]).map((c) => ({ t: c.epoch, o: c.open, h: c.high, l: c.low, c: c.close, v: Math.abs(c.close - c.open) * 1000 + 1 }));
  const last = candles[candles.length - 1];
  let open = dayOpen.get(symbol);
  if (!open || Date.now() - open.at > 60_000) {
    const dr = await pub.call({ ticks_history: d, end: "latest", count: 1, style: "candles", granularity: 86400 });
    open = { at: Date.now(), open: dr.candles[0]?.open ?? candles[0].o };
    dayOpen.set(symbol, open);
  }
  const age = Date.now() / 1000 - last.t;
  return { symbol, price: last.c, prevClose: open.open, candles, live: age < 180, updatedAt: last.t * 1000 };
}

let cache: { at: number; data: Quote[] } | null = null;
let inflight: Promise<Quote[]> | null = null;

export const market = {
  snapshot: base.handler(async () => {
    if (cache && Date.now() - cache.at < 2000) return cache.data;
    inflight ??= Promise.all(Object.keys(SYMBOLS).map(quote)).finally(() => (inflight = null));
    const data = await inflight;
    cache = { at: Date.now(), data };
    return data;
  }),
};
