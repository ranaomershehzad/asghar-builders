import { money } from "../format";
import { balanceMeaning, ledgerFor, type Entry, type Job } from "../types";
import { StatusChip } from "./ui";

export function JobsTab({
  jobs,
  entries,
  onEdit,
  onNew,
}: {
  jobs: Job[];
  entries: Entry[];
  onEdit: (j: Job) => void;
  onNew: () => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="empty">
        No jobs yet.
        <br />
        <br />
        <button className="primary" style={{ maxWidth: 220 }} onClick={onNew}>
          Add first job
        </button>
      </div>
    );
  }

  return (
    <>
      {jobs.map((job) => {
        const l = ledgerFor(job.id, entries);
        const meaning = balanceMeaning(job, l);
        return (
          <button className="pcard" key={job.id} onClick={() => onEdit(job)}>
            <span className="t">
              <h3>{job.name}</h3>
              <StatusChip status={job.status} />
            </span>
            <span className="kindtag">
              {job.kind === "own" ? "Own build" : job.client ? `For ${job.client}` : "For a client"}
            </span>
            <span className="pline">
              <span>Received</span>
              <b>{money(l.received)}</b>
            </span>
            <span className="pline">
              <span>Paid out</span>
              <b>{money(l.paidOut)}</b>
            </span>
            <span className="pline">
              <span>{meaning.headline}</span>
              <b
                style={{
                  color:
                    meaning.tone === "good"
                      ? "var(--good)"
                      : meaning.tone === "bad"
                        ? "var(--bad)"
                        : undefined,
                }}
              >
                {money(Math.abs(l.balance))}
              </b>
            </span>
          </button>
        );
      })}
      <button className="primary" onClick={onNew}>
        + New job
      </button>
    </>
  );
}
