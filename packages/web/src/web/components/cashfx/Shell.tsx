import { useState, type ReactNode } from "react";
import { Home, BarChart3, History, TrendingUp, Wallet, User, Menu, X } from "lucide-react";
import { useApp, money, type Tab } from "../../lib/store";

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "markets", label: "Markets", icon: BarChart3 },
  { id: "history", label: "History", icon: History },
  { id: "trade", label: "Trade", icon: TrendingUp },
  { id: "wallet", label: "Wallet", icon: Wallet },
  { id: "account", label: "Account", icon: User },
];

export const Logo = ({ size = "text-2xl" }: { size?: string }) => (
  <span className={`${size} font-black italic tracking-tight`}><span className="text-green-500">CASH</span>FX</span>
);

export function Shell({ children }: { children: ReactNode }) {
  const { tab, setTab, balance, mode } = useApp();
  const [menu, setMenu] = useState(false);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[480px] bg-black shadow-[0_0_80px_rgba(34,197,94,.08)]">
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-black/90 px-4 py-3 backdrop-blur">
        <button onClick={() => setMenu(true)}><Menu size={26} /></button>
        <button onClick={() => setTab("home")} className="flex-1 text-left"><Logo /></button>
        <button onClick={() => setTab("wallet")} className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-center">
          <div className={`text-[9px] font-bold tracking-widest ${mode === "real" ? "text-red-400" : "text-white/60"}`}>{mode === "real" ? "REAL" : "DEMO"}</div>
          <div className="num text-sm font-extrabold">{money(balance)}</div>
        </button>
        <button onClick={() => setTab("wallet")} className="rounded-lg bg-green-500 px-3.5 py-2.5 text-xs font-extrabold text-black">DEPOSIT</button>
      </header>

      <main className="pb-28">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[480px] -translate-x-1/2 items-end justify-between border-t border-white/10 bg-[#050805]/95 px-2 pb-3 pt-2 backdrop-blur">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          if (id === "trade")
            return (
              <button key={id} onClick={() => setTab(id)} className="-mt-7 flex flex-1 flex-col items-center gap-1">
                <span className={`flex h-14 w-14 items-center justify-center rounded-full border-4 border-black bg-gradient-to-b from-green-500 to-green-700 glow-green ${active ? "" : "opacity-90"}`}><Icon size={26} /></span>
                <span className={`text-[11px] font-semibold ${active ? "text-green-400" : "text-white/60"}`}>{label}</span>
              </button>
            );
          return (
            <button key={id} onClick={() => setTab(id)} className="relative flex flex-1 flex-col items-center gap-1 pt-1">
              {active && <span className="absolute -top-2 h-0.5 w-8 rounded bg-green-500" />}
              <Icon size={24} className={active ? "text-green-400" : "text-white/80"} />
              <span className={`text-[11px] font-semibold ${active ? "text-green-400" : "text-white/60"}`}>{label}</span>
            </button>
          );
        })}
      </nav>


      {menu && (
        <div className="fixed inset-0 z-[80] bg-black/70">
          <button aria-label="Close menu" className="absolute inset-0 cursor-default" onClick={() => setMenu(false)} />
          <div className="relative h-full w-72 bg-[#080c09] p-5">
            <div className="mb-6 flex items-center justify-between"><Logo /><button aria-label="Close menu" onClick={() => setMenu(false)}><X /></button></div>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { setTab(id); setMenu(false); }} className={`mb-1 flex w-full items-center gap-3 rounded-xl px-4 py-3.5 font-bold ${tab === id ? "bg-green-500/15 text-green-400" : ""}`}>
                <Icon size={20} />{label}
              </button>
            ))}
            <p className="mt-8 px-2 text-xs leading-relaxed text-white/40">Real Deriv prices and orders. Demo mode uses virtual money; Real mode uses your real balance.</p>
          </div>
        </div>
      )}
    </div>
  );
}

