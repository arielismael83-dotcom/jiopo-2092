import { useState } from "react";
import { INSTRUMENTS, fmtPrice, getChangePct, useMarketTick } from "../../lib/market";
import { useApp } from "../../lib/store";
import { Flag } from "./ui";

export function MarketsScreen() {
  const { setSymbol, setTab } = useApp();
  const [f, setF] = useState("All");
  useMarketTick();
  const list = INSTRUMENTS.filter((i) => f === "All" || i.cat === f);
  return (
    <div className="p-4">
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {["All", "Forex", "Commodities", "Crypto"].map((c) => (
          <button key={c} onClick={() => setF(c)} className={`rounded-full border px-5 py-2 text-sm font-bold ${f === c ? "border-green-500 bg-green-500 text-black" : "border-white/10 bg-white/5"}`}>{c}</button>
        ))}
      </div>
      <div className="card divide-y divide-white/5">
        {list.map((m) => {
          const c = getChangePct(m.symbol), up = c >= 0;
          return (
            <button key={m.symbol} onClick={() => { setSymbol(m.symbol); setTab("trade"); }} className="flex w-full items-center gap-3 p-4 text-left">
              <Flag symbol={m.symbol} size={44} />
              <div className="flex-1"><div className="font-extrabold">{m.symbol}</div><div className="text-xs text-white/50">{m.name}</div></div>
              <div className="text-right"><div className="num text-lg font-extrabold">{fmtPrice(m.symbol)}</div>
                <span className={`num mt-0.5 inline-block rounded px-2 py-0.5 text-xs font-bold ${up ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>{up ? "+" : ""}{c.toFixed(2)}%</span></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
