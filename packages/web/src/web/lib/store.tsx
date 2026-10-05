import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { client } from "./api";
import type { Position, HistoryItem } from "../../api/routes/trading";

export type Tab = "home" | "markets" | "history" | "trade" | "wallet" | "account";
export type Mode = "demo" | "real";
interface Acc { mode: Mode; id: string; balance: number; currency: string }

interface Ctx {
  tab: Tab; setTab: (t: Tab) => void;
  symbol: string; setSymbol: (s: string) => void;
  mode: Mode; setMode: (m: Mode) => void;
  accounts: Acc[]; balance: number; accountId: string;
  positions: Position[]; history: HistoryItem[]; openPnl: number;
  error: string | null; loaded: boolean;
  refresh: () => Promise<void>;
  openTrade: (side: "BUY" | "SELL", stake: number) => Promise<string | null>;
  closeTrade: (id: number) => Promise<string | null>;
  resetDemo: () => Promise<string | null>;
  depositOpen: boolean; setDepositOpen: (b: boolean) => void;
  sideHint: "BUY" | "SELL" | null; setSideHint: (s: "BUY" | "SELL" | null) => void;
}
const C = createContext<Ctx>(null!);
export const useApp = () => useContext(C);
const msg = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

export function AppProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>("home");
  const [symbol, setSymbol] = useState("EUR/USD");
  const [mode, setModeState] = useState<Mode>(() => (localStorage.getItem("cashfx-mode") === "real" ? "real" : "demo"));
  const [accounts, setAccounts] = useState<Acc[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [sideHint, setSideHint] = useState<"BUY" | "SELL" | null>(null);

  const setMode = useCallback((m: Mode) => { localStorage.setItem("cashfx-mode", m); setPositions([]); setHistory([]); setModeState(m); }, []);

  const refresh = useCallback(async () => {
    try {
      const [a, p, h] = await Promise.all([client.trading.accounts(), client.trading.positions({ mode }), client.trading.history({ mode })]);
      setAccounts(a); setPositions(p); setHistory(h); setError(null);
    } catch (e) { setError(msg(e)); }
    setLoaded(true);
  }, [mode]);

  useEffect(() => { refresh(); const t = setInterval(refresh, 4000); return () => clearInterval(t); }, [refresh]);

  const openTrade = useCallback(async (side: "BUY" | "SELL", stake: number) => {
    if (!(stake >= 1)) return "Minimum stake is $1";
    if (mode === "real" && !confirm(`REAL MONEY: ${side} ${symbol} with $${stake.toFixed(2)}.\nYou can lose the whole stake. Confirm?`)) return "Cancelled";
    try { await client.trading.open({ mode, symbol, side, stake, confirmReal: mode === "real" }); await refresh(); return null; } catch (e) { return msg(e); }
  }, [mode, symbol, refresh]);
  const closeTrade = useCallback(async (id: number) => {
    try { await client.trading.close({ mode, id }); await refresh(); return null; } catch (e) { return msg(e); }
  }, [mode, refresh]);
  const resetDemo = useCallback(async () => {
    try { await client.trading.resetDemo(); await refresh(); return null; } catch (e) { return msg(e); }
  }, [refresh]);

  const acc = accounts.find((a) => a.mode === mode);
  const openPnl = positions.reduce((s, p) => s + p.pnl, 0);

  const value = useMemo<Ctx>(() => ({
    tab, setTab, symbol, setSymbol, mode, setMode, accounts, balance: acc?.balance ?? 0, accountId: acc?.id ?? "",
    positions, history, openPnl, error, loaded, refresh, openTrade, closeTrade, resetDemo, depositOpen, setDepositOpen, sideHint, setSideHint,
  }), [tab, symbol, mode, setMode, accounts, acc, positions, history, openPnl, error, loaded, refresh, openTrade, closeTrade, resetDemo, depositOpen, sideHint]);
  return <C.Provider value={value}>{children}</C.Provider>;
}

export const money = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const signed = (n: number) => (n >= 0 ? "+" : "-") + money(Math.abs(n));
