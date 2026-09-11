import { useState } from "react";
import { inWords, parseAmount, today } from "../format";
import { newId } from "../store";
import {
  COMMON_UNITS,
  IN_CATEGORIES,
  METHODS,
  OUT_CATEGORIES,
  knownItems,
  type Direction,
  type Entry,
  type Job,
  type Method,
} from "../types";
import { Choice, Sheet, SheetActions } from "./ui";

export function EntrySheet({
  existing,
  direction,
  jobs,
  entries,
  defaultJobId,
  onSave,
  onDelete,
  onClose,
}: {
  existing: Entry | null;
  direction: Direction;
  jobs: Job[];
  entries: Entry[];
  defaultJobId: string;
  onSave: (e: Entry) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const isIn = direction === "in";
  const categories = isIn ? IN_CATEGORIES : OUT_CATEGORIES;

  const [amount, setAmount] = useState(existing ? String(existing.amount) : "");
  const [item, setItem] = useState(existing?.item ?? "");
  const [quantity, setQuantity] = useState(
    existing?.quantity != null ? String(existing.quantity) : "",
  );
  const [unit, setUnit] = useState(existing?.unit ?? "");
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

  const suggestions = knownItems(entries);
  const qty = parseAmount(quantity);
  const value = parseAmount(amount);
  const rate = !isIn && qty > 0 && value > 0 ? value / qty : null;

  function save() {
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
      item: isIn ? null : item.trim() || null,
      quantity: isIn || qty <= 0 ? null : qty,
      unit: isIn || qty <= 0 ? null : unit.trim() || null,
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
        {inWords(value) && <div className="inwords">{inWords(value)}</div>}
      </div>

      {isIn ? (
        <div className="field">
          <label className="lbl" htmlFor="description">
            What was it for
          </label>
          <input
            id="description"
            type="text"
            placeholder="e.g. second instalment"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      ) : (
        <>
          <div className="field">
            <label className="lbl" htmlFor="item">
              What did you buy
            </label>
            <input
              id="item"
              type="text"
              list="item-suggestions"
              placeholder="e.g. Cement"
              value={item}
              onChange={(e) => setItem(e.target.value)}
            />
            <datalist id="item-suggestions">
              {suggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          <div className="two">
            <div className="field">
              <label className="lbl" htmlFor="quantity">
                How many (optional)
              </label>
              <input
                id="quantity"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 40"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="field">
              <label className="lbl" htmlFor="unit">
                Unit
              </label>
              <input
                id="unit"
                type="text"
                list="unit-suggestions"
                placeholder="bags"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
              <datalist id="unit-suggestions">
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
            </div>
          </div>

          {rate !== null && (
            <div className="hint ratehint">
              That works out at Rs {Math.round(rate).toLocaleString("en-US")} per{" "}
              {unit.trim() ? unit.trim().replace(/s$/, "") : "unit"}.
            </div>
          )}
        </>
      )}

      <Choice
        label="Type"
        options={categories as readonly string[]}
        value={category}
        onChange={setCategory}
      />

      <div className="field">
        <label className="lbl" htmlFor="job">
          Project
        </label>
        <div className="selectwrap">
          <select id="job" value={jobId} onChange={(e) => setJobId(e.target.value)}>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
                {j.client ? ` — ${j.client}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      {!isIn && (
        <div className="field">
          <label className="lbl" htmlFor="note">
            Note (optional)
          </label>
          <input
            id="note"
            type="text"
            placeholder="Anything worth remembering"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      )}

      <Choice
        label={isIn ? "Received by" : "Paid by"}
        options={METHODS}
        value={method}
        onChange={setMethod}
      />

      {existing && (
        <button className="danger" onClick={() => (armed ? onDelete(existing.id) : setArmed(true))}>
          {armed ? "Tap again to delete for good" : "Delete this entry"}
        </button>
      )}

      <SheetActions>
        {error && <div className="errline">{error}</div>}
        <button
          className="primary"
          onClick={save}
          style={isIn ? { background: "var(--good)" } : undefined}
        >
          {existing ? "Save changes" : isIn ? "Add money in" : "Add money out"}
        </button>
      </SheetActions>
    </Sheet>
  );
}
