import { useEffect, useRef } from "react";
import { getCandles, getInstrument, getPrice, useMarketTick } from "../../lib/market";

const UP = "#26a69a", DOWN = "#ef5350";

export function Chart({ symbol, height = 420 }: { symbol: string; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const tick = useMarketTick();

  useEffect(() => {
    const cv = ref.current, w = wrap.current;
    if (!cv || !w) return;
    const dpr = window.devicePixelRatio || 1;
    const W = w.clientWidth, H = height;
    cv.width = W * dpr; cv.height = H * dpr;
    cv.style.width = W + "px"; cv.style.height = H + "px";
    const g = cv.getContext("2d")!;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    const ins = getInstrument(symbol);
    const all = getCandles(symbol);
    const axisW = 64, volH = 56, padT = 36;
    const plotW = W - axisW, plotH = H - volH - padT - 8;
    const n = Math.max(24, Math.floor(plotW / 9));
    const cs = all.slice(-n);
    if (!cs.length) { g.fillStyle = "rgba(255,255,255,.5)"; g.textAlign = "center"; g.fillText("Loading live prices…", W / 2, H / 2); g.textAlign = "left"; return; }
    let hi = Math.max(...cs.map((c) => c.h)), lo = Math.min(...cs.map((c) => c.l));
    const pad = (hi - lo) * 0.12 || hi * 0.001; hi += pad; lo -= pad;
    const y = (p: number) => padT + (hi - p) / (hi - lo) * plotH;
    const step = plotW / n;

    g.font = "11px 'Plus Jakarta Sans', sans-serif"; g.textBaseline = "middle";
    // grid + axis
    for (let i = 0; i <= 9; i++) {
      const p = hi - ((hi - lo) * i) / 9, yy = y(p);
      g.strokeStyle = "rgba(255,255,255,.06)"; g.beginPath(); g.moveTo(0, yy); g.lineTo(plotW, yy); g.stroke();
      g.fillStyle = i % 4 === 0 ? "#fff" : "rgba(255,255,255,.7)";
      g.fillText(p.toFixed(ins.decimals), plotW + 8, yy);
    }
    // volume
    const vmax = Math.max(...cs.map((c) => c.v));
    cs.forEach((c, i) => {
      const up = c.c >= c.o, x = i * step;
      g.fillStyle = up ? "rgba(38,166,154,.55)" : "rgba(239,83,80,.55)";
      const vh = (c.v / vmax) * volH;
      g.fillRect(x + 1.5, H - vh, step - 3, vh);
    });
    // candles
    cs.forEach((c, i) => {
      const up = c.c >= c.o, x = i * step + step / 2;
      g.strokeStyle = g.fillStyle = up ? UP : DOWN;
      g.beginPath(); g.moveTo(x, y(c.h)); g.lineTo(x, y(c.l)); g.stroke();
      const top = y(Math.max(c.o, c.c)), bh = Math.max(1.5, Math.abs(y(c.o) - y(c.c)));
      g.fillRect(x - step * 0.34, top, step * 0.68, bh);
    });
    // last price
    const last = getPrice(symbol), ly = y(last);
    const up = cs[cs.length - 1].c >= cs[cs.length - 1].o;
    g.setLineDash([3, 3]); g.strokeStyle = up ? UP : DOWN; g.beginPath(); g.moveTo(0, ly); g.lineTo(plotW, ly); g.stroke(); g.setLineDash([]);
    g.fillStyle = up ? UP : DOWN; g.fillRect(plotW + 2, ly - 10, axisW - 2, 20);
    g.fillStyle = "#fff"; g.fillText(last.toFixed(ins.decimals), plotW + 6, ly);
  }, [symbol, tick, height]);

  return (
    <div ref={wrap} className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black">
      <canvas ref={ref} aria-label={`${symbol} candlestick chart`} className="block" />
      <div className="pointer-events-none absolute left-3 top-2 text-xs font-semibold text-white/90">Vol</div>
    </div>
  );
}
