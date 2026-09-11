/** All amounts are Pakistani rupees. */
export function money(n: number, opts: { plus?: boolean } = {}): string {
  const v = Math.round(Number(n) || 0);
  const digits = Math.abs(v).toLocaleString("en-US");
  const sign = v < 0 ? "\u2212" : opts.plus && v > 0 ? "+" : "";
  return `${sign}Rs ${digits}`;
}

/** How he says it: Rs 42.0 lakh, Rs 1.72 cr. Below a lakh, the exact figure
 *  is already short, so it is used as-is. */
export function shortMoney(n: number): string {
  const v = Math.round(Number(n) || 0);
  const abs = Math.abs(v);
  const sign = v < 0 ? "\u2212" : "";
  if (abs >= 10000000) return `${sign}Rs ${trim(abs / 10000000)} cr`;
  if (abs >= 100000) return `${sign}Rs ${trim(abs / 100000)} lakh`;
  return money(v);
}

function trim(x: number): string {
  return x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2);
}

/** "42 lakh", "1.25 crore", "40 thousand" — how the amount is said out loud.
 *  Returns null for small change that nobody would say this way. */
export function inWords(n: number): string | null {
  const v = Math.round(Number(n) || 0);
  const abs = Math.abs(v);
  if (abs < 1000) return null;
  const sign = v < 0 ? "−" : "";
  if (abs >= 10000000) return `${sign}${trim(abs / 10000000)} crore`;
  if (abs >= 100000) return `${sign}${trim(abs / 100000)} lakh`;
  return `${sign}${trim(abs / 1000)} thousand`;
}

export const today = (): string => new Date().toISOString().slice(0, 10);

export function niceDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  if (iso === today()) return "Today";
  if (iso === new Date(Date.now() - 864e5).toISOString().slice(0, 10)) return "Yesterday";
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function parseAmount(raw: string): number {
  const v = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(v) ? v : 0;
}

/** "200 bags", "1.5 ton" — trailing zeros trimmed. */
export function qty(quantity: number, unit: string | null): string {
  const n = Number(quantity) || 0;
  const shown = Number.isInteger(n) ? n.toLocaleString("en-US") : String(Number(n.toFixed(3)));
  return unit && unit.trim() ? `${shown} ${unit.trim()}` : shown;
}

/** The exact rupees to print small under a lakh/crore figure. Null when the
 *  headline figure is already exact, so nothing is printed twice. */
export function exactUnder(n: number): string | null {
  return Math.abs(Math.round(Number(n) || 0)) >= 100000 ? money(n) : null;
}
