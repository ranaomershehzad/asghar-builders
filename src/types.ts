/** Money coming in: an instalment from the party, or a sale. */
export const IN_CATEGORIES = [
  "Advance",
  "Progress payment",
  "Final payment",
  "Sale",
  "Other",
] as const;

/** Money going out. "My drawing" is his own money taken from the job —
 *  it leaves the balance but is not a cost of building. */
export const OUT_CATEGORIES = [
  "Materials",
  "Labour",
  "Subcontract",
  "Permits",
  "Equipment",
  "Utilities",
  "Land",
  "My drawing",
  "Other",
] as const;

export const DRAWING = "My drawing";

export const CATEGORY_COLOR: Record<string, string> = {
  Materials: "#B4762A",
  Labour: "#1C5A9E",
  Subcontract: "#6A4A9C",
  Permits: "#2A7350",
  Equipment: "#8A959C",
  Utilities: "#0E7A86",
  Land: "#8C6210",
  "My drawing": "#A93727",
  Other: "#7A6A5E",
};

export const METHODS = ["Cash", "Bank", "Card"] as const;
export const STATUSES = ["Active", "On hold", "Finished"] as const;
export const KINDS = ["client", "own"] as const;

export type InCategory = (typeof IN_CATEGORIES)[number];
export type OutCategory = (typeof OUT_CATEGORIES)[number];
export type Method = (typeof METHODS)[number];
export type Status = (typeof STATUSES)[number];
export type Kind = (typeof KINDS)[number];
export type Direction = "in" | "out";

export type Job = {
  id: string;
  name: string;
  client: string | null;
  kind: Kind;
  status: Status;
  notes: string | null;
};

export type Entry = {
  id: string;
  job_id: string;
  direction: Direction;
  entry_date: string;
  category: string;
  description: string | null;
  amount: number;
  party: string | null;
  method: Method;
};

export type Ledger = {
  /** Everything received. */
  received: number;
  /** Everything paid out, drawings included. */
  paidOut: number;
  /** Paid out on the job itself — excludes his own drawings. */
  costs: number;
  /** His own money taken out of the job. */
  drawings: number;
  /** received − paidOut. Positive means cash still in hand. */
  balance: number;
};

export function ledgerFor(jobId: string, entries: Entry[]): Ledger {
  let received = 0;
  let costs = 0;
  let drawings = 0;

  for (const e of entries) {
    if (e.job_id !== jobId) continue;
    if (e.direction === "in") received += e.amount;
    else if (e.category === DRAWING) drawings += e.amount;
    else costs += e.amount;
  }

  const paidOut = costs + drawings;
  return { received, paidOut, costs, drawings, balance: received - paidOut };
}

/** What the balance means, in his words rather than an accountant's. */
export function balanceMeaning(job: Job, l: Ledger): { headline: string; tone: "good" | "bad" | "" } {
  if (job.kind === "own") {
    if (l.received > 0) {
      return {
        headline: l.balance >= 0 ? "Profit on this build" : "Loss on this build",
        tone: l.balance >= 0 ? "good" : "bad",
      };
    }
    return { headline: "Your own money in this build so far", tone: "" };
  }
  if (l.balance > 0) return { headline: "Party's money still in your hand", tone: "good" };
  if (l.balance < 0) return { headline: "You are out of pocket — the party owes you", tone: "bad" };
  return { headline: "Square with the party", tone: "" };
}

export type LedgerRow = { entry: Entry; balance: number };

/** Chronological running balance, returned newest first for display. */
export function runningBalance(jobId: string, entries: Entry[]): LedgerRow[] {
  const mine = entries
    .filter((e) => e.job_id === jobId)
    .sort((a, b) =>
      a.entry_date < b.entry_date ? -1 : a.entry_date > b.entry_date ? 1 : a.id < b.id ? -1 : 1,
    );

  let balance = 0;
  const rows: LedgerRow[] = mine.map((entry) => {
    balance += entry.direction === "in" ? entry.amount : -entry.amount;
    return { entry, balance };
  });

  return rows.reverse();
}
