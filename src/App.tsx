import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { configured, supabase } from "./supabase";
import { clearCache, useStore } from "./store";
import { downloadCsv } from "./csv";
import type { Direction, Entry, Job } from "./types";
import { Login } from "./components/Login";
import { LedgerTab } from "./components/LedgerTab";
import { JobsTab } from "./components/JobsTab";
import { ReportTab } from "./components/ReportTab";
import { EntrySheet } from "./components/EntrySheet";
import { JobSheet } from "./components/JobSheet";

type Tab = "ledger" | "jobs" | "report";
type SheetState =
  | { kind: "none" }
  | { kind: "entry"; existing: Entry | null; direction: Direction }
  | { kind: "job"; existing: Job | null };

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!configured) {
    return (
      <div className="login">
        <div className="mark">
          ASGHAR
          <br />
          <span>BUILDERS</span>
        </div>
        <p>
          This copy has no database details yet. Add <code>VITE_SUPABASE_URL</code> and{" "}
          <code>VITE_SUPABASE_ANON_KEY</code> in Vercel (Project Settings → Environment Variables),
          then redeploy. The README has the steps.
        </p>
      </div>
    );
  }

  if (!ready)
    return (
      <div className="login">
        <p>Loading…</p>
      </div>
    );
  if (!session) return <Login />;
  return <Book userId={session.user.id} email={session.user.email ?? ""} />;
}

function Book({ userId, email }: { userId: string; email: string }) {
  const store = useStore(userId);
  const { jobs, entries } = store;

  const [tab, setTab] = useState<Tab>("ledger");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetState>({ kind: "none" });
  const [toast, setToast] = useState<string | null>(null);

  const activeJob = useMemo(
    () => jobs.find((j) => j.id === activeId) ?? jobs[0] ?? null,
    [jobs, activeId],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function signOut() {
    clearCache();
    await supabase.auth.signOut();
  }

  const closeSheet = () => setSheet({ kind: "none" });

  return (
    <div className="app">
      <header className="top">
        <div className="top-row">
          <div className="brand">
            ASGHAR <span>BUILDERS</span>
          </div>
          <div className="spacer" />
          <button className="iconbtn" onClick={signOut} title={email}>
            Sign out
          </button>
        </div>
        <div className="chips">
          {jobs.map((j) => (
            <button
              className="chip"
              key={j.id}
              aria-pressed={j.id === activeJob?.id}
              onClick={() => setActiveId(j.id)}
            >
              {j.name}
            </button>
          ))}
          <button className="chip add" onClick={() => setSheet({ kind: "job", existing: null })}>
            + Job
          </button>
        </div>
      </header>

      <main>
        {store.unsynced > 0 && (
          <div className="banner warnish">
            {store.unsynced} {store.unsynced === 1 ? "entry is" : "entries are"} saved on this phone
            and waiting for signal. They'll go up on their own.
          </div>
        )}
        {store.error && store.unsynced === 0 && <div className="banner warnish">{store.error}</div>}

        {tab === "ledger" && (
          <LedgerTab
            job={activeJob}
            entries={entries}
            onEdit={(e) => setSheet({ kind: "entry", existing: e, direction: e.direction })}
            onNewJob={() => setSheet({ kind: "job", existing: null })}
          />
        )}
        {tab === "jobs" && (
          <JobsTab
            jobs={jobs}
            entries={entries}
            onEdit={(j) => setSheet({ kind: "job", existing: j })}
            onNew={() => setSheet({ kind: "job", existing: null })}
          />
        )}
        {tab === "report" && (
          <ReportTab
            job={activeJob}
            entries={entries}
            onEditJob={(j) => setSheet({ kind: "job", existing: j })}
            onExport={() => {
              downloadCsv(jobs, entries);
              setToast("Ledger downloaded.");
            }}
          />
        )}
      </main>

      {tab === "ledger" && activeJob && (
        <div className="fab">
          <button
            className="money-in"
            onClick={() => setSheet({ kind: "entry", existing: null, direction: "in" })}
          >
            ↓ Money in
          </button>
          <button
            className="money-out"
            onClick={() => setSheet({ kind: "entry", existing: null, direction: "out" })}
          >
            ↑ Money out
          </button>
        </div>
      )}

      <nav className="tabs">
        {(["ledger", "jobs", "report"] as Tab[]).map((t) => (
          <button key={t} aria-current={t === tab} onClick={() => setTab(t)}>
            {t === "ledger" ? "Ledger" : t === "jobs" ? "Jobs" : "Report"}
          </button>
        ))}
      </nav>

      {sheet.kind === "entry" && activeJob && (
        <EntrySheet
          existing={sheet.existing}
          direction={sheet.direction}
          jobs={jobs}
          defaultJobId={activeJob.id}
          onSave={async (e) => {
            closeSheet();
            setActiveId(e.job_id);
            await store.saveEntry(e);
          }}
          onDelete={async (id) => {
            closeSheet();
            await store.deleteEntry(id);
          }}
          onClose={closeSheet}
        />
      )}

      {sheet.kind === "job" && (
        <JobSheet
          existing={sheet.existing}
          entryCount={
            sheet.existing ? entries.filter((e) => e.job_id === sheet.existing!.id).length : 0
          }
          onSave={async (j) => {
            closeSheet();
            setActiveId(j.id);
            await store.saveJob(j);
          }}
          onDelete={async (id) => {
            closeSheet();
            setActiveId(null);
            await store.deleteJob(id);
          }}
          onClose={closeSheet}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
