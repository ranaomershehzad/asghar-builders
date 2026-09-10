/** All amounts are Pakistani rupees. */
export function money(n: number, opts: { plus?: boolean } = {}): string {
  const v = Math.round(Number(n) || 0);
  const digits = Math.abs(v).toLocaleString("en-US");
  const sign = v < 0 ? "\u2212" : opts.plus && v > 0 ? "+" : "";
  return `${sign}Rs ${digits}`;
}

/** Short form for tiles: Rs 42.0 lakh, Rs 1.72 crore. */
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

/** "42 lakh" — the way the amount would be said out loud. */
export function inWords(n: number): string | null {
  const abs = Math.abs(Math.round(Number(n) || 0));
  if (abs < 100000) return null;
  if (abs >= 10000000) return `${trim(abs / 10000000)} crore`;
  return `${trim(abs / 100000)} lakh`;
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
