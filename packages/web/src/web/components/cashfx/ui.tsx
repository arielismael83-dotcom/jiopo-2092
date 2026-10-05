import type { ReactNode } from "react";
import { X } from "lucide-react";
import { getChangePct, fmtPrice, getInstrument } from "../../lib/market";

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <button aria-label="Close" className="absolute inset-0 cursor-default" onClick={onClose} />
      <div className="slide-up relative w-full max-w-[480px] rounded-t-3xl border border-white/10 bg-[#0b100c] p-5 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button onClick={onClose} className="rounded-full bg-white/10 p-1.5"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Flag({ symbol, size = 40 }: { symbol: string; size?: number }) {
  return (
    <div className="flex shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5" style={{ width: size, height: size, fontSize: size * 0.5 }}>
      {getInstrument(symbol).flag}
    </div>
  );
}

export function Change({ symbol, className = "" }: { symbol: string; className?: string }) {
  const c = getChangePct(symbol);
  const up = c >= 0;
  return (
    <span className={`num rounded-md px-2 py-0.5 text-xs font-bold ${up ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"} ${className}`}>
      {up ? "+" : ""}{c.toFixed(2)}%
    </span>
  );
}

export const Price = ({ symbol }: { symbol: string }) => <span className="num">{fmtPrice(symbol)}</span>;

export function AmountField({ value, onChange, quick }: { value: string; onChange: (v: string) => void; quick: number[] }) {
  return (
    <>
      <div className="flex items-center rounded-xl border border-white/10 bg-black px-4 py-3.5">
        <span className="mr-2 text-white/60">$</span>
        <input aria-label="Amount" type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} className="num w-full bg-transparent text-lg font-semibold outline-none" />
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {quick.map((q) => (
          <button key={q} onClick={() => onChange(String(q))}
            className={`rounded-lg border py-2.5 text-sm font-bold ${value === String(q) ? "border-green-500 bg-green-500 text-black" : "border-white/10 bg-white/5"}`}>
            ${q.toLocaleString()}
          </button>
        ))}
      </div>
    </>
  );
}
