import { useEffect, useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { useApp, money, signed } from "../../lib/store";
import { INSTRUMENTS, getInstrument, getPrice, getSpread, fmtPrice, getChangePct, useMarketTick, getUpdatedAt, isReady } from "../../lib/market";
import { Chart } from "./Chart";
import { AmountField, Flag, Sheet } from "./ui";
import { ScannerSheet } from "./Scanner";

export function TradeScreen() {
  const { balance, openPnl, symbol, setSymbol, openTrade, positions: openTrades, history: closedTrades, closeTrade, mode, sideHint, setSideHint } = useApp();
  useMarketTick();
  const [amt, setAmt] = useState("10");
  const [sub, setSub] = useState<"Active" | "Closed" | "Live Chat">("Active");
  const [pick, setPick] = useState(false);
  const [scan, setScan] = useState(false);
  const [msg, setMsg] = useState<{ t: string; ok: boolean } | null>(null);
  const ins = getInstrument(symbol), price = getPrice(symbol), half = getSpread(ins) / 2;
  const fresh = isReady(symbol) && Date.now() - getUpdatedAt(symbol) < 5 * 60_000;
  const chg = getChangePct(symbol), up = chg >= 0;

  useEffect(() => { if (sideHint) { setMsg({ t: `AI suggests ${sideHint} on ${symbol}`, ok: true }); setSideHint(null); } }, [sideHint, symbol, setSideHint]);
  useEffect(() => { if (!msg) return; const t = setTimeout(() => setMsg(null), 3000); return () => clearTimeout(t); }, [msg]);

  const [busy, setBusy] = useState(false);
  const place = async (side: "BUY" | "SELL") => {
    if (busy) return;
    setBusy(true);
    const e = await openTrade(side, parseFloat(amt));
    setBusy(false);
    if (e) { if (e !== "Cancelled") setMsg({ t: e, ok: false }); }
    else { setMsg({ t: `${side} ${symbol} placed on your ${mode} account`, ok: true }); setSub("Active"); }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-px bg-white/5 p-4 pb-3">
        <div className="rounded-l-2xl bg-[#0d120e] p-4"><div className="text-[11px] font-bold tracking-widest text-white/50">BALANCE</div><div className="num text-xl font-extrabold text-green-400">{money(balance)}</div></div>
        <div className="rounded-r-2xl bg-[#0d120e] p-4 text-right"><div className="text-[11px] font-bold tracking-widest text-white/50">PROFIT/LOSS</div><div className={`num text-xl font-extrabold ${openPnl >= 0 ? "text-green-400" : "text-red-400"}`}>{signed(openPnl)}</div></div>
      </div>
      <div className="flex items-center justify-between px-4 py-2">
        <span className={`flex items-center gap-2 text-sm font-bold ${fresh ? "text-green-400" : "text-amber-400"}`}><span className={`live-dot h-2 w-2 rounded-full ${fresh ? "bg-green-500" : "bg-amber-400"}`} />{!isReady(symbol) ? "CONNECTING…" : fresh ? "LIVE" : "CLOSED · " + new Date(getUpdatedAt(symbol)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        <span className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-extrabold ${mode === "real" ? "bg-red-500 text-white" : "bg-white/10"}`}>{mode === "real" ? "REAL ACCOUNT" : "DEMO ACCOUNT"}</span>
      </div>
      <div className="flex gap-8 px-4 py-2 num">
        <div><div className="text-xs text-white/50">BID</div><div className="text-xl font-extrabold text-green-400">{fmtPrice(symbol, price - half)}</div></div>
        <div><div className="text-xs text-white/50">ASK</div><div className="text-xl font-extrabold text-red-400">{fmtPrice(symbol, price + half)}</div></div>
      </div>

      <div className="px-4">
        <button onClick={() => setPick(true)} className="mb-2 flex w-full items-center gap-2 text-left">
          <Flag symbol={symbol} size={24} />
          <span className="text-lg font-bold">{ins.name}</span><ChevronDown size={16} className="text-white/50" />
        </button>
        <div className={`num mb-2 text-sm ${up ? "text-teal-400" : "text-red-400"}`}>{fmtPrice(symbol)} {up ? "+" : ""}{chg.toFixed(2)}%</div>
        <Chart symbol={symbol} />
      </div>

      <div className="mx-4 mt-4 rounded-2xl border border-white/10 p-4" style={{ background: "linear-gradient(160deg,#101326,#0d0a1c)" }}>
        <div className="mb-3 flex items-center justify-between text-[11px] font-bold tracking-widest text-white/60"><span className="flex items-center gap-1.5"><Sparkles size={12} />AI MARKET SCANNER PRO</span><span className="rounded bg-green-500/15 px-1.5 text-green-400">READY</span></div>
        <div className="py-3 text-center"><div className="font-bold">Market Analysis Ready</div><div className="text-xs text-white/50">AI will scan 50+ indicators for the best entry point</div></div>
        <button onClick={() => setScan(true)} className="w-full rounded-xl bg-green-500 py-3.5 text-sm font-extrabold text-black">START AI ANALYSIS</button>
      </div>

      <div className="px-4 pt-6">
        <h3 className="mb-3 font-extrabold">Trading Panel</h3>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => place("BUY")} className="rounded-xl bg-[#00f0a0] py-4 text-lg font-black text-black shadow-[0_0_20px_rgba(0,240,160,.3)] active:scale-95">BUY</button>
          <button onClick={() => place("SELL")} className="rounded-xl bg-[#ff4d4f] py-4 text-lg font-black active:scale-95">SELL</button>
        </div>
        {msg && <div className={`fade-in mt-3 rounded-lg px-3 py-2 text-sm font-semibold ${msg.ok ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{msg.t}</div>}
        <div className="mt-5 text-[11px] font-bold tracking-widest text-white/60">TRADE AMOUNT</div>
        <div className="mt-2"><AmountField value={amt} onChange={setAmt} quick={[10, 50, 100, 500, 1000]} /></div>
        <div className="mt-4 space-y-1.5 text-sm text-white/60">
          <div className="flex justify-between"><span>Price</span><span className="num text-green-400">{fmtPrice(symbol)}</span></div>
          <div className="flex justify-between"><span>Trade Amount</span><span className="num font-bold text-white">{money(parseFloat(amt) || 0)}</span></div>
          <div className="flex justify-between"><span>Multiplier</span><span className="num text-white">x100 · loss capped at stake</span></div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 border-b border-white/10 px-4 text-center text-sm font-bold">
        {(["Active", "Closed", "Live Chat"] as const).map((t) => (
          <button key={t} onClick={() => setSub(t)} className={`pb-3 ${sub === t ? "border-b-2 border-green-500 text-green-400" : "text-white/50"}`}>{t}</button>
        ))}
      </div>
      <div className="p-4">
        {sub === "Active" && (openTrades.length === 0 ? <Empty t="No active trades at the moment." /> : openTrades.map((t) => (
          <div key={t.id} className="card mb-2 flex items-center gap-3 p-3.5">
            <span className={`rounded px-2 py-1 text-[10px] font-black ${t.side === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{t.side}</span>
            <div className="flex-1"><div className="font-bold">{t.symbol}</div><div className="num text-xs text-white/50">{money(t.stake)} @ {fmtPrice(t.symbol, t.entry)}</div></div>
            <div className={`num font-extrabold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{signed(t.pnl)}</div>
            <button onClick={() => closeTrade(t.id)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold">Close</button>
          </div>
        )))}
        {sub === "Closed" && (closedTrades.length === 0 ? <Empty t="No closed trades yet." /> : closedTrades.slice(0, 10).map((t) => (
          <div key={t.id} className="card mb-2 flex items-center gap-3 p-3.5">
            <span className={`rounded px-2 py-1 text-[10px] font-black ${t.side === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{t.side}</span>
            <div className="flex-1"><div className="font-bold">{t.symbol}</div><div className="num text-xs text-white/50">stake {money(t.stake)}</div></div>
            <div className={`num font-extrabold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{signed(t.pnl)}</div>
          </div>
        )))}
        {sub === "Live Chat" && <Empty t="Support: use the chat on deriv.com." />}
      </div>

      <Sheet open={pick} onClose={() => setPick(false)} title="Select market">
        <div className="max-h-[55vh] space-y-1 overflow-y-auto">
          {INSTRUMENTS.map((m) => (
            <button key={m.symbol} onClick={() => { setSymbol(m.symbol); setPick(false); }} className={`flex w-full items-center gap-3 rounded-xl p-3 ${m.symbol === symbol ? "bg-green-500/15" : "hover:bg-white/5"}`}>
              <Flag symbol={m.symbol} size={36} /><span className="flex-1 text-left font-bold">{m.symbol}</span><span className="num text-sm text-white/70">{fmtPrice(m.symbol)}</span>
            </button>
          ))}
        </div>
      </Sheet>
      <ScannerSheet open={scan} onClose={() => setScan(false)} />
    </div>
  );
}
const Empty = ({ t }: { t: string }) => <div className="py-8 text-center text-sm text-white/50"><div className="mb-1 text-2xl">📊</div>{t}</div>;
