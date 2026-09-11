import { useState } from "react";
import { shortMoney } from "../format";
import { balanceMeaning, ledgerFor, type Entry, type Job } from "../types";
import { StatusChip } from "./ui";

function ProjectCard({
  job,
  entries,
  onOpen,
  onEdit,
}: {
  job: Job;
  entries: Entry[];
  onOpen: (j: Job) => void;
  onEdit: (j: Job) => void;
}) {
  const l = ledgerFor(job.id, entries);
  const meaning = balanceMeaning(job, l);
  const tone =
    meaning.tone === "good" ? "var(--good)" : meaning.tone === "bad" ? "var(--bad)" : undefined;

  return (
    <div className="pcard">
      <button className="pcard-main" onClick={() => onOpen(job)}>
        <span className="t">
          <h3>{job.name}</h3>
          <StatusChip status={job.status} />
        </span>
        <span className="kindtag">
          {job.kind === "own" ? "Own build" : job.client ? `For ${job.client}` : "For a client"}
        </span>
        <span className="pline">
          <span>Received</span>
          <b>{shortMoney(l.received)}</b>
        </span>
        <span className="pline">
          <span>Paid out</span>
          <b>{shortMoney(l.paidOut)}</b>
        </span>
        <span className="pline">
          <span>{meaning.short}</span>
          <b style={{ color: tone }}>{shortMoney(Math.abs(l.balance))}</b>
        </span>
      </button>
      <button className="pcard-edit" onClick={() => onEdit(job)}>
        Edit details
      </button>
    </div>
  );
}

export function ProjectsTab({
  jobs,
  entries,
  onOpen,
  onEdit,
  onNew,
}: {
  jobs: Job[];
  entries: Entry[];
  onOpen: (j: Job) => void;
  onEdit: (j: Job) => void;
  onNew: () => void;
}) {
  const [showFinished, setShowFinished] = useState(false);

  const running = jobs.filter((j) => j.status !== "Finished");
  const finished = jobs.filter((j) => j.status === "Finished");

  if (jobs.length === 0) {
    return (
      <div className="empty">
        No projects yet.
        <br />
        <br />
        <button className="primary" style={{ maxWidth: 220 }} onClick={onNew}>
          Add first project
        </button>
      </div>
    );
  }

  return (
    <>
      {running.length === 0 ? (
        <div className="empty">
          Nothing on the go. Every project is finished.
          <br />
          <br />
          <button className="primary" style={{ maxWidth: 220 }} onClick={onNew}>
            Start a new project
          </button>
        </div>
      ) : (
        running.map((job) => (
          <ProjectCard key={job.id} job={job} entries={entries} onOpen={onOpen} onEdit={onEdit} />
        ))
      )}

      {running.length > 0 && (
        <button className="primary" onClick={onNew}>
          + New project
        </button>
      )}

      {finished.length > 0 && (
        <>
          <button
            className="archive-toggle"
            aria-expanded={showFinished}
            onClick={() => setShowFinished((v) => !v)}
          >
            <span className="lbl">
              Finished · {finished.length}
            </span>
            <span className="rule" />
            <span className="chev">{showFinished ? "Hide" : "Show"}</span>
          </button>

          {showFinished &&
            finished.map((job) => (
              <ProjectCard
                key={job.id}
                job={job}
                entries={entries}
                onOpen={onOpen}
                onEdit={onEdit}
              />
            ))}
        </>
      )}
    </>
  );
}
