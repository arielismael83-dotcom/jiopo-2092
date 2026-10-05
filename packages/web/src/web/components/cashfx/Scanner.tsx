import { useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Sheet, Flag } from "./ui";
import { scan, fmtPrice, getPrice } from "../../lib/market";
import { useApp } from "../../lib/store";

export function ScannerSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setSymbol, setTab, setSideHint } = useApp();
  const [res, setRes] = useState<ReturnType<typeof scan> | null>(null);
  useEffect(() => {
    if (!open) return;
    setRes(null);
    const t = setTimeout(() => setRes(scan()), 1800);
    return () => clearTimeout(t);
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} title="AI Market Scanner">
      {!res ? (
        <div className="flex flex-col items-center py-10">
          <Sparkles className="live-dot mb-4 text-fuchsia-400" size={40} />
          <div className="font-bold">Scanning 50+ indicators…</div>
          <div className="mt-1 text-sm text-white/50">Looking for the best entry point</div>
        </div>
      ) : (
        <div className="fade-in">
          <div className="card flex items-center gap-3 p-4">
            <Flag symbol={res.ins.symbol} size={48} />
            <div className="flex-1">
              <div className="text-xs text-white/50">TOP AI PICK</div>
              <div className="text-xl font-extrabold">{res.ins.symbol}</div>
              <div className="num text-sm text-white/60">{fmtPrice(res.ins.symbol, getPrice(res.ins.symbol))}</div>
            </div>
            <div className="text-right">
              <div className={`rounded px-2 py-0.5 text-[10px] font-extrabold ${res.side === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{res.side} SIGNAL</div>
              <div className="mt-1 text-2xl font-black">{res.score}%</div>
              <div className="text-[9px] tracking-widest text-white/40">CONFIDENCE</div>
            </div>
          </div>
          <button onClick={() => { setSymbol(res.ins.symbol); setSideHint(res.side); setTab("trade"); onClose(); }} className="btn-ai glow-pink mt-4 w-full rounded-xl py-4 font-extrabold">Trade {res.ins.symbol} now</button>
          <p className="mt-3 text-center text-[11px] text-white/40">Signal from short-term momentum of real market prices. Not financial advice.</p>
        </div>
      )}
    </Sheet>
  );
}

export function ScannerCard({ onOpen }: { onOpen: () => void }) {
  const pick = scan();
  return (
    <div className="card p-4" style={{ background: "linear-gradient(160deg,#0f2a1c,#120d1c)" }}>
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/20 text-green-400"><Sparkles size={20} /></div>
        <div>
          <div className="font-extrabold">Best Market Match</div>
          <div className="text-xs text-white/60">AI scans for the most profitable trades in real-time.</div>
        </div>
      </div>
      <div className="card mt-4 flex items-center gap-3 p-3">
        <Flag symbol={pick.ins.symbol} size={40} />
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-wider text-white/50">TOP AI PICK</div>
          <div className="text-lg font-extrabold">{pick.ins.symbol}</div>
        </div>
        <div className="w-28 text-right">
          <div className={`ml-auto w-fit rounded px-1.5 text-[9px] font-extrabold ${pick.side === "BUY" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>{pick.side} SIGNAL</div>
          <div className="text-lg font-black">{pick.score}% Match</div>
          <div className="mt-1 h-1 rounded bg-white/10"><div className="h-1 rounded bg-white" style={{ width: pick.score + "%" }} /></div>
        </div>
      </div>
      <button onClick={onOpen} className="btn-ai glow-pink mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-extrabold"><Search size={16} />OPEN AI SCANNER</button>
    </div>
  );
}
