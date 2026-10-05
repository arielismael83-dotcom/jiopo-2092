import { useEffect, useState } from "react";
import { ArrowUpRight, ScanLine, History, BarChart3, Wallet, UserPlus, Landmark, Rocket, TrendingUp, TrendingDown } from "lucide-react";
import { useApp } from "../../lib/store";
import { INSTRUMENTS, fmtPrice, getChangePct, useMarketTick } from "../../lib/market";
import { Flag } from "./ui";
import { ScannerCard, ScannerSheet } from "./Scanner";

const WORDS = ["Trade Anywhere", "Trade Anytime", "Trade Smarter"];

function Typed() {
  const [i, setI] = useState(0), [n, setN] = useState(0), [del, setDel] = useState(false);
  useEffect(() => {
    const w = WORDS[i];
    const t = setTimeout(() => {
      if (!del && n < w.length) setN(n + 1);
      else if (!del) setDel(true);
      else if (n > 0) setN(n - 1);
      else { setDel(false); setI((i + 1) % WORDS.length); }
    }, del ? 40 : n === w.length ? 1400 : 90);
    return () => clearTimeout(t);
  }, [n, del, i]);
  return <span className="caret">{WORDS[i].slice(0, n)}</span>;
}

export function HomeScreen() {
  const { setTab, setSymbol } = useApp();
  const [scan, setScan] = useState(false);
  useMarketTick();
  return (
    <div className="space-y-6 p-4">
      <section className="card relative overflow-hidden p-6 fade-in" style={{ background: "radial-gradient(circle at 80% 0%,rgba(34,197,94,.2),transparent 60%),#0a1410", borderRadius: 28 }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(34,197,94,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(34,197,94,.3) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative">
          <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-1.5 text-[10px] font-bold tracking-widest"><span className="live-dot h-2 w-2 rounded-full bg-green-500" />REAL-TIME MARKET DATA</div>
          <h1 className="text-[40px] font-black leading-[1.05] tracking-tight">Easy Trading<br /><Typed /></h1>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">Simple, fast and reliable trading platform. Your Deriv account, in one simple interface. Trade forex, crypto and commodities from your phone.</p>
          <button onClick={() => setTab("trade")} className="btn-ai glow-pink mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-extrabold"><TrendingUp size={16} />START TRADING</button>
          <button onClick={() => setTab("wallet")} className="glow-green mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-sm font-extrabold text-black"><Wallet size={16} />DEPOSIT</button>
          <div className="card mt-5 grid grid-cols-3 divide-x divide-white/10 py-4 text-center" style={{ background: "rgba(0,0,0,.4)" }}>
            {[["6", "MARKETS"], ["REAL", "ORDERS"], ["24/7", "CRYPTO"]].map(([a, b]) => (
              <div key={b}><div className="text-2xl font-black">{a}</div><div className="text-[9px] font-bold tracking-widest text-white/50">{b}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><BarChart3 size={18} />Market Overview</h2>
          <button onClick={() => setTab("markets")} className="text-sm text-white/60">View all ›</button>
        </div>
        <div className="card divide-y divide-white/5">
          {INSTRUMENTS.slice(0, 4).map((m) => {
            const c = getChangePct(m.symbol), up = c >= 0;
            return (
              <button key={m.symbol} onClick={() => { setSymbol(m.symbol); setTab("trade"); }} className="flex w-full items-center gap-3 p-3.5 text-left">
                <Flag symbol={m.symbol} />
                <div className="flex-1"><div className="font-extrabold">{m.symbol}</div><div className="text-xs text-white/50">{m.name}</div></div>
                <div className="text-right"><div className="num font-bold">{fmtPrice(m.symbol)}</div>
                  <div className={`num flex items-center justify-end gap-1 text-xs font-bold ${up ? "text-green-400" : "text-red-400"}`}>{up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{up ? "+" : ""}{c.toFixed(2)}%</div></div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-extrabold">✦ AI Market Scanner</h2><span className="text-xs text-white/50">Powered by AI</span></div>
        <ScannerCard onOpen={() => setScan(true)} />
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><ArrowUpRight size={18} />Quick Actions</h2>
        <div className="grid grid-cols-4 gap-2">
          {[[ScanLine, "Scanner", () => setScan(true)], [History, "History", () => setTab("history")], [BarChart3, "Markets", () => setTab("markets")], [Wallet, "Wallet", () => setTab("wallet")]].map(([I, l, f]: any) => (
            <button key={l} onClick={f} className="card flex flex-col items-center gap-2 py-4 text-xs font-semibold text-white/80"><I size={22} />{l}</button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-extrabold"><Rocket size={18} />How It Works</h2><span className="text-xs text-white/50">3 easy steps</span></div>
        <div className="space-y-3">
          {[[UserPlus, "Register Account", "Create your free account and verify your phone number."], [Landmark, "Deposit Instantly", "Fund your account instantly using our secure payment gateway."], [TrendingUp, "Start Profiting", "Open trades on your favorite pairs and withdraw profits instantly."]].map(([I, t, d]: any, k) => (
            <div key={t} className="card flex items-center gap-3 p-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-600 font-black">{k + 1}</div>
              <div><div className="flex items-center gap-1.5 font-extrabold"><I size={14} />{t}</div><div className="text-xs text-white/60">{d}</div></div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-white/40">Real Deriv prices and orders · Trade responsibly. You can lose your whole stake.</p>
      </section>
      <ScannerSheet open={scan} onClose={() => setScan(false)} />
    </div>
  );
}
