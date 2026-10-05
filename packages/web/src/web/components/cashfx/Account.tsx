import { useApp, money } from "../../lib/store";

export function AccountScreen() {
  const { mode, setMode, accounts, history, error } = useApp();
  const wins = history.filter((t) => t.pnl > 0).length;
  const real = accounts.find((a) => a.mode === "real");
  return (
    <div className="space-y-5 p-4">
      <h2 className="text-xl font-extrabold">Account</h2>
      <div className="card p-4">
        <div className="mb-3 text-xs font-bold tracking-widest text-white/50">TRADING MODE</div>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-black p-1">
          {(["demo", "real"] as const).map((m) => (
            <button key={m} onClick={() => { if (m === "real" && mode !== "real" && !confirm("Switch to REAL account? Trades will use real money.")) return; setMode(m); }}
              className={`rounded-lg py-3 text-sm font-extrabold capitalize ${mode === m ? (m === "real" ? "bg-red-500 text-white" : "bg-green-500 text-black") : "text-white/60"}`}>{m}</button>
          ))}
        </div>
        <p className="mt-3 text-xs text-white/50">{mode === "real" ? "Real mode: orders are placed on your Deriv real account." : "Demo mode: real Deriv orders with virtual money."}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[["Closed (30)", history.length], ["Wins", wins], ["Win rate", history.length ? Math.round((wins / history.length) * 100) + "%" : "–"]].map(([a, b]) => (
          <div key={a} className="card py-4"><div className="text-xl font-black">{b}</div><div className="text-[10px] tracking-widest text-white/50">{String(a).toUpperCase()}</div></div>
        ))}
      </div>
      <div className="card p-4 text-sm text-white/70">
        <div className="flex justify-between"><span>Real balance</span><b className="num text-white">{money(real?.balance ?? 0)}</b></div>
        <div className="mt-2 text-xs text-white/40">Trades use Deriv multipliers (x100). Your loss on a trade is limited to its stake. Max real stake per trade is capped on the server.</div>
      </div>
      {error && <div className="rounded-lg bg-red-500/15 p-3 text-sm text-red-400">{error}</div>}
    </div>
  );
}
