import { today } from "./format";
import { ledgerFor, runningBalance, type Entry, type Job } from "./types";

const quote = (v: unknown): string => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** The ledger as a spreadsheet: every entry with its running balance,
 *  job by job, then a summary block. */
export function buildCsv(jobs: Job[], entries: Entry[]): string {
  const lines: string[] = [];

  lines.push(
    ["Date", "Job", "Client", "Description", "Category", "Paid to / from", "Method", "In (Rs)", "Out (Rs)", "Balance (Rs)"]
      .map(quote)
      .join(","),
  );

  jobs.forEach((job) => {
    // Oldest first reads like a book; runningBalance hands back newest first.
    [...runningBalance(job.id, entries)].reverse().forEach(({ entry, balance }) => {
      lines.push(
        [
          entry.entry_date,
          job.name,
          job.client,
          entry.description,
          entry.category,
          entry.party,
          entry.method,
          entry.direction === "in" ? entry.amount : "",
          entry.direction === "out" ? entry.amount : "",
          balance,
        ]
          .map(quote)
          .join(","),
      );
    });
  });

  lines.push("");
  lines.push(
    ["Job", "Client", "Type", "Stage", "Received", "Spent on job", "Taken out", "Balance"]
      .map(quote)
      .join(","),
  );
  jobs.forEach((job) => {
    const l = ledgerFor(job.id, entries);
    lines.push(
      [
        job.name,
        job.client,
        job.kind === "own" ? "Own build" : "For a client",
        job.status,
        l.received,
        l.costs,
        l.drawings,
        l.balance,
      ]
        .map(quote)
        .join(","),
    );
  });

  return lines.join("\n");
}

export function downloadCsv(jobs: Job[], entries: Entry[]): void {
  const blob = new Blob(["﻿", buildCsv(jobs, entries)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asghar-builders-${today()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
