/** Server-side Deriv client. The token never leaves the server. */
declare const process: { env: Record<string, string | undefined> };
export const env = (k: string) => process.env[k];
export type Mode = "demo" | "real";

const REST = "https://api.derivws.com/trading/v1/options";
const PUBLIC_WS = "wss://api.derivws.com/trading/v1/options/ws/public";

export const SYMBOLS: Record<string, string> = {
  "EUR/USD": "frxEURUSD", "GBP/USD": "frxGBPUSD", "USD/JPY": "frxUSDJPY",
  "XAU/USD": "frxXAUUSD", "BTC/USD": "cryBTCUSD", "ETH/USD": "cryETHUSD",
};
export const toDeriv = (s: string) => SYMBOLS[s];
export const fromDeriv = (d: string) => Object.keys(SYMBOLS).find((k) => SYMBOLS[k] === d) ?? d;

const headers = () => ({
  Authorization: `Bearer ${env("DERIV_PAT")}`,
  "Deriv-App-ID": env("DERIV_APP_ID") ?? "",
});
export const configured = () => !!env("DERIV_PAT") && !!env("DERIV_APP_ID");

export interface Account { account_id: string; balance: string; currency: string; account_type: Mode; status: string }
let accCache: { at: number; data: Account[] } | null = null;
export async function getAccounts(force = false): Promise<Account[]> {
  if (!force && accCache && Date.now() - accCache.at < 15_000) return accCache.data;
  const r = await fetch(`${REST}/accounts`, { headers: headers() });
  if (!r.ok) throw new Error(`Deriv accounts ${r.status}`);
  const data = (await r.json()).data as Account[];
  accCache = { at: Date.now(), data };
  return data;
}
const accountId = async (mode: Mode) => {
  const a = (await getAccounts()).find((x) => x.account_type === mode);
  if (!a) throw new Error(`No ${mode} account`);
  return a.account_id;
};

class Conn {
  private ws: WebSocket | null = null;
  private opening: Promise<WebSocket> | null = null;
  private pending = new Map<number, { res: (v: any) => void; rej: (e: Error) => void; t: ReturnType<typeof setTimeout> }>();
  private seq = 1;
  constructor(private urlFn: () => Promise<string>) {}

  private open(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === 1) return Promise.resolve(this.ws);
    this.opening ??= (async () => {
      const ws = new WebSocket(await this.urlFn());
      await new Promise<void>((res, rej) => { ws.onopen = () => res(); ws.onerror = () => rej(new Error("Deriv WebSocket failed")); });
      ws.onmessage = (e) => {
        const d = JSON.parse(String(e.data));
        const p = this.pending.get(d.req_id);
        if (!p) return;
        clearTimeout(p.t); this.pending.delete(d.req_id);
        if (d.error) p.rej(Object.assign(new Error(d.error.message), { code: d.error.code }));
        else p.res(d);
      };
      ws.onclose = () => {
        this.ws = null;
        for (const [, p] of this.pending) { clearTimeout(p.t); p.rej(new Error("Connection closed")); }
        this.pending.clear();
      };
      this.ws = ws;
      return ws;
    })().finally(() => { this.opening = null; });
    return this.opening;
  }

  async call(req: Record<string, unknown>, timeout = 15_000): Promise<any> {
    const ws = await this.open();
    const id = this.seq++;
    return new Promise((res, rej) => {
      const t = setTimeout(() => { this.pending.delete(id); rej(new Error("Deriv request timed out")); }, timeout);
      this.pending.set(id, { res, rej, t });
      ws.send(JSON.stringify({ ...req, req_id: id }));
    });
  }
}

export const pub = new Conn(async () => PUBLIC_WS);
const conns: Partial<Record<Mode, Conn>> = {};
export function acct(mode: Mode) {
  conns[mode] ??= new Conn(async () => {
    const id = await accountId(mode);
    const r = await fetch(`${REST}/accounts/${id}/otp`, { method: "POST", headers: headers() });
    const j = await r.json();
    if (!r.ok || !j.data?.url) throw new Error(j.errors?.[0]?.message ?? `OTP failed (${r.status})`);
    return j.data.url as string;
  });
  return conns[mode]!;
}

export async function resetDemo() {
  const id = await accountId("demo");
  const r = await fetch(`${REST}/accounts/${id}/reset-demo-balance`, { method: "POST", headers: headers() });
  if (!r.ok) throw new Error(`Reset failed (${r.status})`);
  accCache = null;
}
