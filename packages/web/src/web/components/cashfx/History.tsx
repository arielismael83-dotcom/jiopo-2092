import { useApp, money, signed } from "../../lib/store";
import { fmtPrice } from "../../lib/market";

export function HistoryScreen() {
  const { history, positions, closeTrade, mode } = useApp();
  return (
    <div className="p-4">
      <h2 className="text-xl font-extrabold">History</h2>
      <p className="mb-4 text-sm text-white/60">{mode === "real" ? "Real account" : "Demo account"} · from your Deriv account</p>
      {positions.length > 0 && <h3 className="mb-2 text-xs font-bold tracking-widest text-white/50">OPEN</h3>}
      {positions.map((p) => (
        <div key={p.id} className="card mb-2 flex items-center gap-3 p-3.5">
          <span className={`rounded px-2 py-1 text-[10px] font-black ${p.side === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{p.side}</span>
          <div className="flex-1"><div className="font-bold">{p.symbol}</div><div className="num text-xs text-white/50">{money(p.stake)} @ {fmtPrice(p.symbol, p.entry)}</div></div>
          <div className={`num font-extrabold ${p.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{signed(p.pnl)}</div>
          <button onClick={() => closeTrade(p.id)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold">Close</button>
        </div>
      ))}
      <h3 className="mb-2 mt-4 text-xs font-bold tracking-widest text-white/50">CLOSED</h3>
      <div className="card divide-y divide-white/5">
        {history.length === 0 && <div className="p-8 text-center text-sm text-white/50">No closed trades yet.</div>}
        {history.map((t) => (
          <div key={t.id} className="flex items-center gap-3 p-3.5">
            <span className={`rounded px-2 py-1 text-[10px] font-black ${t.side === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{t.side}</span>
            <div className="flex-1"><div className="font-bold">{t.symbol}</div><div className="text-xs text-white/50">{new Date(t.closedAt).toLocaleString()}</div></div>
            <div className="text-right"><div className={`num font-extrabold ${t.pnl >= 0 ? "text-green-400" : "text-red-400"}`}>{signed(t.pnl)}</div><div className="num text-[10px] text-white/40">stake {money(t.stake)}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
