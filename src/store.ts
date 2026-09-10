import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import type { Entry, Job } from "./types";

const CACHE_KEY = "asghar-cache-v2";
const OUTBOX_KEY = "asghar-outbox-v2";

type Pending =
  | { table: "jobs"; op: "upsert"; row: Job }
  | { table: "jobs"; op: "delete"; id: string }
  | { table: "entries"; op: "upsert"; row: Entry }
  | { table: "entries"; op: "delete"; id: string };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the server copy is the real one */
  }
}

const numberish = (v: unknown): number => Number(v ?? 0) || 0;

const normJob = (r: Record<string, unknown>): Job => ({
  id: String(r.id),
  name: String(r.name ?? ""),
  client: (r.client as string) ?? null,
  kind: r.kind as Job["kind"],
  status: r.status as Job["status"],
  notes: (r.notes as string) ?? null,
});

const normEntry = (r: Record<string, unknown>): Entry => ({
  id: String(r.id),
  job_id: String(r.job_id),
  direction: r.direction as Entry["direction"],
  entry_date: String(r.entry_date),
  category: String(r.category),
  description: (r.description as string) ?? null,
  amount: numberish(r.amount),
  party: (r.party as string) ?? null,
  method: r.method as Entry["method"],
});

export type Store = ReturnType<typeof useStore>;

export function useStore(userId: string | null) {
  const cached = read<{ jobs: Job[]; entries: Entry[] }>(CACHE_KEY, { jobs: [], entries: [] });
  const [jobs, setJobs] = useState<Job[]>(cached.jobs);
  const [entries, setEntries] = useState<Entry[]>(cached.entries);
  const [loading, setLoading] = useState(true);
  const [unsynced, setUnsynced] = useState(read<Pending[]>(OUTBOX_KEY, []).length);
  const [error, setError] = useState<string | null>(null);
  const flushing = useRef(false);

  const cache = useCallback((j: Job[], e: Entry[]) => {
    write(CACHE_KEY, { jobs: j, entries: e });
  }, []);

  /** Send everything waiting in the outbox, oldest first. Stops at the
   *  first failure so ordering is preserved. */
  const flush = useCallback(async () => {
    if (flushing.current) return;
    flushing.current = true;
    try {
      let queue = read<Pending[]>(OUTBOX_KEY, []);
      while (queue.length) {
        const job = queue[0];
        const res =
          job.op === "upsert"
            ? await supabase.from(job.table).upsert({ ...job.row, created_by: userId })
            : await supabase.from(job.table).delete().eq("id", job.id);
        if (res.error) break;
        queue = queue.slice(1);
        write(OUTBOX_KEY, queue);
      }
      setUnsynced(queue.length);
    } finally {
      flushing.current = false;
    }
  }, [userId]);

  const enqueue = useCallback(
    async (job: Pending) => {
      const queue = read<Pending[]>(OUTBOX_KEY, []);
      queue.push(job);
      write(OUTBOX_KEY, queue);
      setUnsynced(queue.length);
      await flush();
    },
    [flush],
  );

  const refresh = useCallback(async () => {
    const [j, e] = await Promise.all([
      supabase.from("jobs").select("*").order("created_at", { ascending: true }),
      supabase.from("entries").select("*").order("entry_date", { ascending: false }),
    ]);
    if (j.error || e.error) {
      setError("Can't reach the server. Showing your last saved copy.");
      return;
    }
    setError(null);
    const nextJobs = (j.data ?? []).map(normJob);
    const nextEntries = (e.data ?? []).map(normEntry);
    setJobs(nextJobs);
    setEntries(nextEntries);
    cache(nextJobs, nextEntries);
  }, [cache]);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    (async () => {
      await flush();
      if (alive) await refresh();
      if (alive) setLoading(false);
    })();
    const onOnline = () => {
      void flush().then(refresh);
    };
    window.addEventListener("online", onOnline);
    return () => {
      alive = false;
      window.removeEventListener("online", onOnline);
    };
  }, [userId, flush, refresh]);

  const saveJob = useCallback(
    async (row: Job) => {
      const next = jobs.some((j) => j.id === row.id)
        ? jobs.map((j) => (j.id === row.id ? row : j))
        : [...jobs, row];
      setJobs(next);
      cache(next, entries);
      await enqueue({ table: "jobs", op: "upsert", row });
    },
    [jobs, entries, cache, enqueue],
  );

  const deleteJob = useCallback(
    async (id: string) => {
      const nextJobs = jobs.filter((j) => j.id !== id);
      const nextEntries = entries.filter((e) => e.job_id !== id);
      setJobs(nextJobs);
      setEntries(nextEntries);
      cache(nextJobs, nextEntries);
      // Ledger rows go with the job: the foreign key cascades server-side.
      await enqueue({ table: "jobs", op: "delete", id });
    },
    [jobs, entries, cache, enqueue],
  );

  const saveEntry = useCallback(
    async (row: Entry) => {
      const next = entries.some((e) => e.id === row.id)
        ? entries.map((e) => (e.id === row.id ? row : e))
        : [row, ...entries];
      setEntries(next);
      cache(jobs, next);
      await enqueue({ table: "entries", op: "upsert", row });
    },
    [jobs, entries, cache, enqueue],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const next = entries.filter((e) => e.id !== id);
      setEntries(next);
      cache(jobs, next);
      await enqueue({ table: "entries", op: "delete", id });
    },
    [jobs, entries, cache, enqueue],
  );

  return {
    jobs,
    entries,
    loading,
    unsynced,
    error,
    refresh,
    saveJob,
    deleteJob,
    saveEntry,
    deleteEntry,
  };
}

export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(OUTBOX_KEY);
  } catch {
    /* nothing to clear */
  }
}

export const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
