import { money, niceDate } from "../format";
import { runningBalance, CATEGORY_COLOR, type Entry, type Job, type LedgerRow } from "../types";
import { BalanceCard } from "./BalanceCard";

export function LedgerTab({
  job,
  entries,
  onEdit,
  onNewJob,
}: {
  job: Job | null;
  entries: Entry[];
  onEdit: (e: Entry) => void;
  onNewJob: () => void;
}) {
  if (!job) {
    return (
      <div className="empty">
        No jobs yet.
        <br />
        <br />
        <button className="primary" style={{ maxWidth: 220 }} onClick={onNewJob}>
          Add first job
        </button>
      </div>
    );
  }

  const rows = runningBalance(job.id, entries);
  const days: { date: string; items: LedgerRow[] }[] = [];
  for (const row of rows) {
    const last = days[days.length - 1];
    if (last && last.date === row.entry.entry_date) last.items.push(row);
    else days.push({ date: row.entry.entry_date, items: [row] });
  }

  return (
    <>
      <BalanceCard job={job} entries={entries} />

      {days.length === 0 ? (
        <div className="empty">
          Nothing in the ledger yet.
          <br />
          Start with the money the party gave you — tap <b>Money in</b>.
        </div>
      ) : (
        days.map((day) => {
          const net = day.items.reduce(
            (sum, r) => sum + (r.entry.direction === "in" ? r.entry.amount : -r.entry.amount),
            0,
          );
          return (
            <div className="daygroup" key={day.date}>
              <div className="dayhead">
                <span className="lbl">{niceDate(day.date)}</span>
                <span className="rule" />
                <span className="amt num">
                  {net >= 0 ? "+" : "−"}
                  {money(Math.abs(net))}
                </span>
              </div>
              {day.items.map(({ entry, balance }) => (
                <button className="row" key={entry.id} onClick={() => onEdit(entry)}>
                  <span
                    className="tag"
                    style={{
                      background:
                        entry.direction === "in"
                          ? "var(--good)"
                          : (CATEGORY_COLOR[entry.category] ?? "var(--line)"),
                    }}
                  />
                  <span className="mid">
                    <span className="desc">{entry.description || entry.category}</span>
                    <span className="meta">
                      {[entry.category, entry.party, entry.method].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="right">
                    <span className={`amt num ${entry.direction === "in" ? "in" : ""}`}>
                      {entry.direction === "in" ? "+" : "−"}
                      {money(entry.amount)}
                    </span>
                    <span className={`bal ${balance < 0 ? "negative" : ""}`}>
                      {money(balance)}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          );
        })
      )}
    </>
  );
}
