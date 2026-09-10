import { useState } from "react";
import { newId } from "../store";
import { KINDS, STATUSES, type Job, type Kind, type Status } from "../types";
import { Choice, Sheet } from "./ui";

const KIND_LABEL: Record<Kind, string> = {
  client: "For a client",
  own: "Own build",
};

export function JobSheet({
  existing,
  entryCount,
  onSave,
  onDelete,
  onClose,
}: {
  existing: Job | null;
  entryCount: number;
  onSave: (j: Job) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(existing?.name ?? "");
  const [kind, setKind] = useState<Kind>(existing?.kind ?? "client");
  const [client, setClient] = useState(existing?.client ?? "");
  const [status, setStatus] = useState<Status>(existing?.status ?? "Active");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  function save() {
    if (!name.trim()) {
      setError("Give the job a site name or address.");
      return;
    }
    onSave({
      id: existing?.id ?? newId(),
      name: name.trim(),
      kind,
      client: kind === "own" ? null : client.trim() || null,
      status,
      notes: notes.trim() || null,
    });
  }

  return (
    <Sheet title={existing ? "Job details" : "New job"} onClose={onClose}>
      <div className="field">
        <label className="lbl" htmlFor="name">
          Site name or address
        </label>
        <input
          id="name"
          type="text"
          autoFocus
          placeholder="e.g. Plot 12, Gulberg"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="field">
        <span className="lbl">Type of job</span>
        <div className="pick">
          {KINDS.map((k) => (
            <button key={k} type="button" aria-pressed={k === kind} onClick={() => setKind(k)}>
              {KIND_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      {kind === "client" && (
        <div className="field">
          <label className="lbl" htmlFor="client">
            Client / party
          </label>
          <input
            id="client"
            type="text"
            placeholder="Who the house is for"
            value={client}
            onChange={(e) => setClient(e.target.value)}
          />
        </div>
      )}

      <Choice label="Stage" options={STATUSES} value={status} onChange={setStatus} />

      <div className="field">
        <label className="lbl" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          placeholder={
            kind === "own" ? "Plot size, agent…" : "Agreed scope, phone number…"
          }
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <div className="errline">{error}</div>}

      <div className="hint">
        {kind === "own"
          ? "For an own build, put the land price in as Money out with type Land, and the sale as Money in."
          : "Everything the party pays goes in as Money in. Everything spent goes out. The balance shows whether you are holding their money or your own."}
      </div>

      <button className="primary" onClick={save}>
        {existing ? "Save job" : "Add job"}
      </button>

      {existing && (
        <button className="danger" onClick={() => (armed ? onDelete(existing.id) : setArmed(true))}>
          {armed
            ? "Tap again — this also deletes its ledger"
            : `Delete job and its ${entryCount} ${entryCount === 1 ? "entry" : "entries"}`}
        </button>
      )}
    </Sheet>
  );
}
