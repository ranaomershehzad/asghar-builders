import { useState } from "react";
import { parseAmount, today } from "../format";
import { newId } from "../store";
import {
  IN_CATEGORIES,
  METHODS,
  OUT_CATEGORIES,
  type Direction,
  type Entry,
  type Job,
  type Method,
} from "../types";
import { Choice, Sheet } from "./ui";

export function EntrySheet({
  existing,
  direction,
  jobs,
  defaultJobId,
  onSave,
  onDelete,
  onClose,
}: {
  existing: Entry | null;
  direction: Direction;
  jobs: Job[];
  defaultJobId: string;
  onSave: (e: Entry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const isIn = direction === "in";
  const categories = isIn ? IN_CATEGORIES : OUT_CATEGORIES;

  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<string>(
    existing?.category ?? (isIn ? "Advance" : "Materials"),
  );
  const [entryDate, setEntryDate] = useState(existing?.entry_date ?? today());
  const [jobId, setJobId] = useState(existing?.job_id ?? defaultJobId);
  const [party, setParty] = useState(existing?.party ?? "");
  const [method, setMethod] = useState<Method>(existing?.method ?? "Cash");
  const [error, setError] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  function save() {
    const value = parseAmount(amount);
    if (value <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    onSave({
      id: existing?.id ?? newId(),
      job_id: jobId,
      direction,
      entry_date: entryDate || today(),
      category,
      description: description.trim() || null,
      amount: value,
      party: party.trim() || null,
      method,
    });
  }

  const title = existing
    ? isIn
      ? "Edit money in"
      : "Edit money out"
    : isIn
      ? "Money received"
      : "Money paid out";

  return (
    <Sheet title={title} onClose={onClose}>
      <div className="field money">
        <label className="lbl" htmlFor="amount">
          Amount (Rs)
        </label>
        <input
          id="amount"
          type="text"
          inputMode="decimal"
          autoFocus
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={isIn ? { color: "var(--good)" } : undefined}
        />
      </div>

      <div className="field">
        <label className="lbl" htmlFor="description">
          What was it for
        </label>
        <input
          id="description"
          type="text"
          placeholder={isIn ? "e.g. second instalment" : "e.g. 40 bags cement"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <Choice label="Type" options={categories as readonly string[]} value={category} onChange={setCategory} />

      <div className="two">
        <div className="field">
          <label className="lbl" htmlFor="date">
            Date
          </label>
          <input
            id="date"
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="job">
            Job
          </label>
          <select id="job" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="lbl" htmlFor="party">
          {isIn ? "Received from (optional)" : "Paid to (optional)"}
        </label>
        <input
          id="party"
          type="text"
          placeholder={isIn ? "The party's name" : "Supplier or worker"}
          value={party}
          onChange={(e) => setParty(e.target.value)}
        />
      </div>

      <Choice label={isIn ? "Received by" : "Paid by"} options={METHODS} value={method} onChange={setMethod} />

      {error && <div className="errline">{error}</div>}

      <button
        className="primary"
        onClick={save}
        style={isIn ? { background: "var(--good)" } : undefined}
      >
        {existing ? "Save changes" : isIn ? "Add money in" : "Add money out"}
      </button>

      {existing && (
        <button className="danger" onClick={() => (armed ? onDelete(existing.id) : setArmed(true))}>
          {armed ? "Tap again to delete for good" : "Delete this entry"}
        </button>
      )}
    </Sheet>
  );
}
