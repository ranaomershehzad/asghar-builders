import { inWords, money, shortMoney } from "../format";
import { balanceMeaning, ledgerFor, type Entry, type Job } from "../types";
import { StatusChip } from "./ui";

export function BalanceCard({ job, entries }: { job: Job; entries: Entry[] }) {
  const l = ledgerFor(job.id, entries);
  const meaning = balanceMeaning(job, l);
  const words = inWords(Math.abs(l.balance));

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
        <div className={`big num ${meaning.tone}`}>{money(Math.abs(l.balance))}</div>
        <div className={`meaning ${meaning.tone}`}>{meaning.headline}</div>
        {words && <div className="sub">{words}</div>}
      </div>

      <div className="grid4">
        <div className="cell">
          <div className="lbl">Received</div>
          <div className="v num">{shortMoney(l.received)}</div>
        </div>
        <div className="cell">
          <div className="lbl">Spent on job</div>
          <div className="v num">{shortMoney(l.costs)}</div>
        </div>
        <div className="cell">
          <div className="lbl">Taken out</div>
          <div className="v num">{shortMoney(l.drawings)}</div>
        </div>
        <div className="cell">
          <div className="lbl">Balance</div>
          <div className="v num" style={{ color: l.balance < 0 ? "var(--bad)" : undefined }}>
            {shortMoney(l.balance)}
          </div>
        </div>
      </div>
    </section>
  );
}
