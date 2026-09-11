import { useState } from "react";
import { money, niceDate, qty, shortMoney } from "../format";
import { runningBalance, CATEGORY_COLOR, type Entry, type Job, type LedgerRow } from "../types";
import { BalanceCard } from "./BalanceCard";

const ALL = "__all";
const MONEY_IN = "__in";

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
  const [filter, setFilter] = useState<string>(ALL);

  if (!job) {
    return (
      <div className="empty">
        No projects yet.
        <br />
        <br />
        <button className="primary" style={{ maxWidth: 220 }} onClick={onNewJob}>
          Add first project
        </button>
      </div>
    );
  }

  // The running balance is always the true one — filtering changes which
  // rows are listed, never what the balance was on the day.
  const all = runningBalance(job.id, entries);
  const outCategories = [
    ...new Set(all.filter((r) => r.entry.direction === "out").map((r) => r.entry.category)),
  ].sort();

  const rows = all.filter(({ entry }) =>
    filter === ALL
      ? true
      : filter === MONEY_IN
        ? entry.direction === "in"
        : entry.direction === "out" && entry.category === filter,
  );

  const days: { date: string; items: LedgerRow[] }[] = [];
  for (const row of rows) {
    const last = days[days.length - 1];
    if (last && last.date === row.entry.entry_date) last.items.push(row);
    else days.push({ date: row.entry.entry_date, items: [row] });
  }

  const filtered = filter !== ALL;
  const filteredTotal = rows.reduce((sum, r) => sum + r.entry.amount, 0);

  return (
    <>
      <BalanceCard job={job} entries={entries} />

      <div className="filterbar">
        <label className="lbl" htmlFor="filter">
          Show
        </label>
        <div className="selectwrap compact">
          <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value={ALL}>Everything</option>
            <option value={MONEY_IN}>Money in only</option>
            {outCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        {filtered && (
          <span className="filtertotal num">
            {rows.length} {rows.length === 1 ? "entry" : "entries"} · {shortMoney(filteredTotal)}
          </span>
        )}
      </div>

      {days.length === 0 ? (
        <div className="empty">
          {filtered ? (
            <>Nothing under that heading yet.</>
          ) : (
            <>
              Nothing in the ledger yet.
              <br />
              Start with the money the party gave you — tap <b>Money in</b>.
            </>
          )}
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
                  {shortMoney(Math.abs(net))}
                </span>
              </div>
              {day.items.map(({ entry, balance }) => {
                const title = entry.item || entry.description || entry.category;
                const amountOf = entry.quantity ? qty(entry.quantity, entry.unit) : null;
                const meta = [entry.category, amountOf, entry.party, entry.method]
                  .filter(Boolean)
                  .join(" · ");
                return (
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
                      <span className="desc">{title}</span>
                      <span className="meta">{meta}</span>
                    </span>
                    <span className="right">
                      <span className={`amt num ${entry.direction === "in" ? "in" : ""}`}>
                        {entry.direction === "in" ? "+" : "−"}
                        {money(entry.amount)}
                      </span>
                      {!filtered && (
                        <span className={`bal ${balance < 0 ? "negative" : ""}`}>
                          {shortMoney(balance)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })
      )}
    </>
  );
}
