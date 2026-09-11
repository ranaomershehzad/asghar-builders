import { exactUnder, shortMoney } from "../format";
import { balanceMeaning, ledgerFor, type Entry, type Job } from "../types";
import { StatusChip } from "./ui";

/** Exact rupees, with the lakh/crore reading underneath — the exact figure
 *  is what he checks, the words are how he says it out loud. */
function Tile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const exact = exactUnder(value);
  return (
    <div className="cell">
      <div className="lbl">{label}</div>
      <div className="v num" style={{ color: tone }}>
        {shortMoney(value)}
      </div>
      {exact && <div className="cellwords num">{exact}</div>}
    </div>
  );
}

export function BalanceCard({ job, entries }: { job: Job; entries: Entry[] }) {
  const l = ledgerFor(job.id, entries);
  const meaning = balanceMeaning(job, l);
  const exact = exactUnder(Math.abs(l.balance));

  return (
    <section className="summary">
      <div className="sum-head">
        <h2>{job.name}</h2>
        <StatusChip status={job.status} />
      </div>
      <div className="sum-head who">
        {job.kind === "own" ? "Own build" : job.client ? `For ${job.client}` : "For a client"}
      </div>

      <div className="headline">
        <div className={`big num ${meaning.tone}`}>{shortMoney(Math.abs(l.balance))}</div>
        {exact && <div className="sub num">{exact}</div>}
        <div className={`meaning ${meaning.tone}`}>{meaning.headline}</div>
      </div>

      <div className="grid4">
        <Tile label="Received" value={l.received} />
        <Tile label="Spent on job" value={l.costs} />
        <Tile label="Taken out" value={l.drawings} />
        <Tile label="Balance" value={l.balance} tone={l.balance < 0 ? "var(--bad)" : undefined} />
      </div>
    </section>
  );
}
