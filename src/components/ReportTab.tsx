import { money, qty } from "../format";
import {
  balanceMeaning,
  itemTotals,
  ledgerFor,
  CATEGORY_COLOR,
  DRAWING,
  type Entry,
  type Job,
} from "../types";

export function ReportTab({
  job,
  entries,
  onEditJob,
}: {
  job: Job | null;
  entries: Entry[];
  onEditJob: (j: Job) => void;
}) {
  if (!job) return <div className="empty">Add a project first.</div>;

  const l = ledgerFor(job.id, entries);
  const meaning = balanceMeaning(job, l);
  const mine = entries.filter((e) => e.job_id === job.id);

  const byCategory = new Map<string, number>();
  for (const e of mine) {
    if (e.direction !== "out" || e.category === DRAWING) continue;
    byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount);
  }
  const rows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;

  const receipts = mine.filter((e) => e.direction === "in");
  const items = itemTotals(job.id, entries);
  const tone =
    meaning.tone === "good" ? "var(--good)" : meaning.tone === "bad" ? "var(--bad)" : undefined;

  return (
    <>
      <section className="panel">
        <h3>The ledger on {job.name}</h3>
        <div className="stmt">
          <div>
            <span>
              Received ({receipts.length} {receipts.length === 1 ? "payment" : "payments"})
            </span>
            <span className="v">{money(l.received)}</span>
          </div>
          <div>
            <span>Spent on the project</span>
            <span className="v">−{money(l.costs)}</span>
          </div>
          <div>
            <span>Taken out</span>
            <span className="v">−{money(l.drawings)}</span>
          </div>
          <div>
            <span>{meaning.short}</span>
            <span className="v" style={{ color: tone }}>
              {money(Math.abs(l.balance))}
            </span>
          </div>
        </div>
        <div className="hint" style={{ marginTop: 8 }}>
          {l.balance >= 0
            ? job.kind === "own"
              ? "Money in beyond what the build has cost."
              : "This much of the party's money has not been spent yet. It is not profit until the job is finished."
            : "He has paid this much of his own money into the project. Ask the party for the next instalment."}
        </div>
      </section>

      <section className="panel">
        <h3>Where the money went</h3>
        {rows.length === 0 ? (
          <div className="hint">Nothing paid out yet.</div>
        ) : (
          rows.map(([cat, value]) => (
            <div className="bar" key={cat}>
              <span className="n">{cat}</span>
              <span className="v num">{money(value)}</span>
              <span className="track">
                <span
                  className="fill"
                  style={{
                    width: `${Math.max(2, (value / max) * 100)}%`,
                    background: CATEGORY_COLOR[cat] ?? "var(--accent)",
                  }}
                />
              </span>
              <span className="hint">{((value / (l.costs || 1)) * 100).toFixed(0)}% of project spend</span>
            </div>
          ))
        )}
        {l.drawings > 0 && (
          <div className="hint" style={{ marginTop: 10 }}>
            Plus {money(l.drawings)} taken out for himself, which is not counted as a project cost.
          </div>
        )}
      </section>

      <section className="panel">
        <h3>What went into this project</h3>
        {items.length === 0 ? (
          <div className="hint">
            Nothing named yet. Fill in <b>What did you buy</b> and <b>How many</b> when adding money
            out, and the running totals appear here.
          </div>
        ) : (
          <div className="items">
            {items.map((it) => (
              <div className="item" key={it.name}>
                <span className="iname">{it.name}</span>
                <span className="icost num">{money(it.cost)}</span>
                <span className="iqty num">
                  {it.byUnit.length
                    ? it.byUnit.map((u) => qty(u.quantity, u.unit)).join(" + ")
                    : `${it.entries} ${it.entries === 1 ? "purchase" : "purchases"}`}
                </span>
                {it.byUnit.length === 1 && it.byUnit[0].quantity > 0 && (
                  <span className="irate">
                    Rs {Math.round(it.cost / it.byUnit[0].quantity).toLocaleString("en-US")} per{" "}
                    {it.byUnit[0].unit.replace(/s$/, "")}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <button className="primary" onClick={() => onEditJob(job)}>
        Edit project details
      </button>
    </>
  );
}
