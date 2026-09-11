import { useEffect, type ReactNode } from "react";

export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-top">
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Choice<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="field">
      <span className="lbl">{label}</span>
      <div className="pick">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={o === value}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StatusChip({ status }: { status: string }) {
  const cls = status === "Finished" ? "sold" : status === "Active" ? "building" : "";
  return <span className={`status ${cls}`}>{status}</span>;
}

/** Pins the save/delete buttons to the bottom of a sheet, so a long form
 *  never hides them behind the browser's own toolbar. */
export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="sheet-actions">{children}</div>;
}
