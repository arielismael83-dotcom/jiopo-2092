import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { env, acct, configured, getAccounts, resetDemo, toDeriv, fromDeriv } from "../lib/deriv";

const Mode = z.enum(["demo", "real"]);
const MULTIPLIER = 100; // lowest Deriv multiplier; loss is capped at the stake
const REAL_MAX_STAKE = Number(env("REAL_MAX_STAKE") ?? 50);

const guard = () => {
  if (!configured()) throw new ORPCError("PRECONDITION_FAILED", { message: "Deriv credentials missing in .env" });
};
const wrap = async <T,>(f: () => Promise<T>): Promise<T> => {
  try { return await f(); } catch (e: any) { throw new ORPCError("BAD_REQUEST", { message: e?.message ?? "Deriv error" }); }
};

export interface Position {
  id: number; symbol: string; side: "BUY" | "SELL"; stake: number; entry: number; current: number;
  value: number; pnl: number; openedAt: number; canSell: boolean;
}
export interface HistoryItem { id: number; symbol: string; side: "BUY" | "SELL"; stake: number; soldFor: number; pnl: number; openedAt: number; closedAt: number }

export const trading = {
  accounts: base.handler(async () => {
    guard();
    return wrap(async () => {
      const a = await getAccounts(true);
      return a.map((x) => ({ mode: x.account_type, id: x.account_id, balance: Number(x.balance), currency: x.currency }));
    });
  }),

  positions: base.input(z.object({ mode: Mode })).handler(({ input }) => {
    guard();
    return wrap(async () => {
      const c = acct(input.mode);
      const p = await c.call({ portfolio: 1 });
      const contracts: any[] = p.portfolio?.contracts ?? [];
      const out = await Promise.all(contracts.map(async (k): Promise<Position> => {
        const o = (await c.call({ proposal_open_contract: 1, contract_id: k.contract_id })).proposal_open_contract;
        const stake = Number(o.buy_price), value = Number(o.bid_price);
        return {
          id: k.contract_id, symbol: fromDeriv(k.underlying_symbol), side: k.contract_type === "MULTUP" ? "BUY" : "SELL",
          stake, entry: Number(o.entry_spot ?? o.entry_tick ?? 0), current: Number(o.current_spot ?? 0),
          value, pnl: value - stake, openedAt: k.purchase_time * 1000, canSell: o.is_valid_to_sell === 1,
        };
      }));
      return out;
    });
  }),

  history: base.input(z.object({ mode: Mode })).handler(({ input }) => {
    guard();
    return wrap(async () => {
      const r = await acct(input.mode).call({ profit_table: 1, description: 1, limit: 30, sort: "DESC" });
      return (r.profit_table?.transactions ?? []).map((t: any): HistoryItem => ({
        id: t.contract_id, symbol: fromDeriv(t.underlying_symbol), side: t.contract_type === "MULTUP" ? "BUY" : "SELL",
        stake: t.buy_price, soldFor: t.sell_price, pnl: t.sell_price - t.buy_price, openedAt: t.purchase_time * 1000, closedAt: t.sell_time * 1000,
      }));
    });
  }),

  open: base
    .input(z.object({ mode: Mode, symbol: z.string(), side: z.enum(["BUY", "SELL"]), stake: z.number().min(1).max(2000), confirmReal: z.boolean().optional() }))
    .handler(({ input }) => {
      guard();
      if (!toDeriv(input.symbol)) throw new ORPCError("BAD_REQUEST", { message: "Unknown market" });
      if (input.mode === "real") {
        if (!input.confirmReal) throw new ORPCError("BAD_REQUEST", { message: "Real trade not confirmed" });
        if (input.stake > REAL_MAX_STAKE) throw new ORPCError("BAD_REQUEST", { message: `Real stake limit is $${REAL_MAX_STAKE} per trade (set REAL_MAX_STAKE in .env)` });
      }
      return wrap(async () => {
        const r = await acct(input.mode).call({
          buy: 1, price: input.stake,
          parameters: { amount: input.stake, basis: "stake", contract_type: input.side === "BUY" ? "MULTUP" : "MULTDOWN", currency: "USD", multiplier: MULTIPLIER, underlying_symbol: toDeriv(input.symbol) },
        });
        return { id: r.buy.contract_id as number, price: r.buy.buy_price as number, balance: r.buy.balance_after as number };
      });
    }),

  close: base.input(z.object({ mode: Mode, id: z.number() })).handler(({ input }) => {
    guard();
    return wrap(async () => {
      const r = await acct(input.mode).call({ sell: input.id, price: 0 });
      return { soldFor: r.sell.sold_for as number, balance: r.sell.balance_after as number };
    });
  }),

  resetDemo: base.handler(() => {
    guard();
    return wrap(async () => { await resetDemo(); return { ok: true }; });
  }),
};
