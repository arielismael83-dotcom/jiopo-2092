import { ArrowDownLeft, ArrowUpRight, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useApp, money, signed } from "../../lib/store";

export function WalletScreen() {
  const { balance, openPnl, mode, accounts, accountId, resetDemo, error } = useApp();
  const [err, setErr] = useState("");
  const link = "https://app.deriv.com/cashier";
  return (
    <div className="space-y-5 p-4">
      <div className="card p-6" style={{ background: "radial-gradient(circle at 90% 0%,rgba(34,197,94,.25),transparent 55%),#0a1410" }}>
        <div className="flex justify-between text-[11px] font-bold tracking-widest text-white/50"><span>{mode === "real" ? "REAL" : "DEMO"} BALANCE</span><span>{accountId}</span></div>
        <div className="num mt-1 text-4xl font-black">{money(balance)}</div>
        <div className="mt-4 text-sm"><div className="text-white/50">Open P/L</div><div className={`num font-bold ${openPnl >= 0 ? "text-green-400" : "text-red-400"}`}>{signed(openPnl)}</div></div>
        {mode === "real" ? (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <a href={link} target="_blank" rel="noreferrer" className="glow-green flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 font-extrabold text-black"><ArrowDownLeft size={18} />Deposit</a>
            <a href={link} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3.5 font-extrabold"><ArrowUpRight size={18} />Withdraw</a>
          </div>
        ) : (
          <button onClick={async () => setErr((await resetDemo()) ?? "")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500 py-3.5 font-extrabold text-black"><RotateCcw size={18} />Reset demo balance</button>
        )}
        {err && <div className="mt-3 text-sm text-red-400">{err}</div>}
      </div>
      <p className="text-xs leading-relaxed text-white/50">{mode === "real" ? "Real deposits and withdrawals (M-Pesa, card…) are handled securely on Deriv's cashier, not in this app." : "Demo money only. Switch to Real in Account to trade your Deriv real balance."}</p>
      <h3 className="font-extrabold">Accounts</h3>
      <div className="card divide-y divide-white/5">
        {accounts.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-4"><div><div className="font-bold capitalize">{a.mode}</div><div className="text-xs text-white/50">{a.id}</div></div><div className="num font-extrabold">{money(a.balance)}</div></div>
        ))}
        {accounts.length === 0 && <div className="p-6 text-center text-sm text-white/50">{error ?? "Loading…"}</div>}
      </div>
    </div>
  );
}
