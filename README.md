# Ahmad Associates

A phone-first **ledger** for a builder: money in from the party, money out to
suppliers and labour, and the running balance — is he holding the client's money,
or is he out of pocket? Three tabs — **Ledger**, **Jobs**, **Report**. Amounts are
Pakistani rupees.

React + Vite frontend, Supabase (Postgres + auth) backend, deployed on Vercel.
Two accounts share one set of data.

---

## Setup, in order

You need a Supabase account and a Vercel account (both free). Total time: about
30 minutes.

To run it on your own Mac you also need Node 20.19+ (Vercel installs its own, so
this is only for local development):

```bash
brew install node
```

### 1. Create the Supabase project

1. Go to supabase.com → **New project**.
2. Name it `ahmad-associates`. Choose the region closest to Pakistan —
   **Southeast Asia (Singapore)** is the nearest option.
3. Set a database password and save it in your password manager. You won't need it
   for this app, but you'll want it later.
4. Wait for the project to finish provisioning (~2 minutes).

### 2. Create the tables

1. In the Supabase dashboard: **SQL Editor** → **New query**.
2. Paste the whole contents of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**.
3. You should see "Success. No rows returned." That's correct — it creates tables, not rows.

This also switches on row level security, so nobody can read the data without being
listed in the `members` table.

### 3. Turn off public sign-ups

**Authentication → Sign In / Providers → Email**:

- Leave **Email** enabled.
- Turn **Confirm email** OFF (there are two users and you create both by hand).

**Authentication → Sign In / Providers** (scroll to the bottom) or
**Authentication → Settings**: turn **Allow new users to sign up** OFF.

This matters. Without it, anyone who finds the URL can create an account. They still
couldn't read anything — the `members` check blocks that — but keeping the door shut
is better than relying on one lock.

### 4. Create the two accounts

**Authentication → Users → Add user → Create new user** (twice):

| | Email | Password |
|---|---|---|
| Your uncle | his email | pick one, write it down for him |
| You | your email | your own |

Tick **Auto Confirm User** for both.

Then go back to **SQL Editor** and run this, with the real emails:

```sql
insert into public.members (user_id, name)
  select id, 'Asghar' from auth.users where email = 'uncle@example.com'
  on conflict (user_id) do nothing;

insert into public.members (user_id, name)
  select id, 'Manager' from auth.users where email = 'you@example.com'
  on conflict (user_id) do nothing;
```

Run `select * from public.members;` to confirm two rows came back. **If this table is
empty, the app will sign in but show nothing** — that's the single most likely thing
to go wrong, and that's the symptom.

### 5. Copy the two keys

**Project Settings → API** (or **API Keys**):

- **Project URL** → `VITE_SUPABASE_URL`
- **anon / public** key → `VITE_SUPABASE_ANON_KEY`

The anon key is safe in a browser — that's what it's designed for; row level security
is what protects the data. Never put the **service_role** key in this app.

### 6. Deploy to Vercel

1. Push this folder to a GitHub repository.
2. vercel.com → **Add New → Project** → import that repository.
3. Vercel detects Vite on its own. Leave the build settings alone.
4. Before deploying, open **Environment Variables** and add both keys from step 5.
   Tick all three environments (Production, Preview, Development).
5. **Deploy**.

If you deployed before adding the variables, the app will tell you they're missing.
Add them, then **Deployments → ⋯ → Redeploy**.

### 7. Put it on his phone

Open the Vercel URL on his phone, sign in once, then:

- **iPhone/Safari**: Share → Add to Home Screen
- **Android/Chrome**: ⋮ → Add to Home screen

It opens full-screen with no browser bar, and the sign-in persists — he won't be
asked for the password again on that phone.

---

## Trying changes without deploying

Two ways, in order of realism:

**1. Against the real database.** Put the same two Supabase keys in `.env.local`,
then `npm run dev`. This is the real app on real data — sign-in, saving, the lot.
Make a project called "Test" and delete it when you're done.

**2. Against fake data, no database at all.** Open
`http://localhost:5173/preview.html` while `npm run dev` is running. It loads a
few made-up projects straight into the browser so you can click every screen
without touching Supabase. The two files behind it (`preview.html`,
`src/preview.tsx`) are listed in `.gitignore` and `.vercelignore`, and Vite only
ever builds `index.html`, so this cannot reach the live site.

Neither costs a deployment.

## Running it locally

```bash
cp .env.example .env.local   # then fill in the two values
npm install
npm run dev
```

Run these **inside the project folder**, not your home directory:

```bash
cd ~/asghar-builders
```

`npm run build` runs the TypeScript check and the production build — the same two
steps Vercel runs, so if it passes here it will pass there.

## What's in here

```
src/
  App.tsx            screen shell, tabs, which sheet is open
  store.ts           loading, saving, offline cache and outbox
  supabase.ts        the client
  types.ts           jobs, entries, categories, the balance maths
  format.ts          rupee formatting, lakh/crore, dates
  components/        Login, the three tabs, the two edit sheets
supabase/schema.sql  tables, row level security, membership
```

## How the data is arranged

Two tables, and one idea: **a job is a site with money coming in and money going out.**

**jobs** — one row per site. (The app calls these *projects*; the table kept its
original name so no migration was needed.) `kind` is `client` (building for someone
who pays in instalments) or `own` (he bought the land and will sell it). Plus the
client's name, stage, and notes.

A project set to **Finished** drops out of the top row of the app and moves into a
collapsed "Finished" group on the Projects tab — after a couple of years that row
would otherwise be unscrollable.

**entries** — the ledger. One row per rupee movement:

| direction | means | categories |
|---|---|---|
| `in` | money received | Advance, Progress payment, Final payment, Sale, Other |
| `out` | money paid | Materials, Labour, Subcontract, Permits, Equipment, Utilities, Land, My drawing, Other |

Money-out entries can also carry `item`, `quantity` and `unit` — "Cement, 200,
bags". The Report totals these per item across every purchase on the project, so
"how many bags of cement have gone into this house" is one glance. Item names are
matched case-insensitively and suggested from what has been typed before, so they
stay consistent.

Everything the app shows comes from those rows:

```
balance = sum(money in) − sum(money out)
```

On a **client job**, a positive balance means he is still holding the party's money,
and a negative balance means he has paid out of his own pocket and is owed. On an
**own build** the land purchase is an `out` entry under `Land`, the sale is an `in`
entry under `Sale` — so the same balance is the profit.

**My drawing** is money he takes out for himself. It leaves the balance, because the
cash really has gone, but it is kept out of "spent on the job" so the cost figures
stay honest.

Categories are fixed by a `check` constraint in the database so they can't drift. To
change them, edit the constraint in `schema.sql` **and** `IN_CATEGORIES` /
`OUT_CATEGORIES` in `src/types.ts` — both, or inserts get rejected.

## Notes on the phone

The app is used almost entirely in a mobile browser, so a few things are deliberate:

- Every form field is set to 16px. Below that, iOS Safari zooms the page when a field
  is focused, and the zoom does not come back on its own.
- Heights use `dvh`, not `vh`. Safari counts its own toolbars inside `vh`, so a `100vh`
  sheet has its bottom hidden behind the browser chrome.
- Each sheet has a sticky header and a sticky footer, so **Cancel** and the save button
  stay reachable no matter how far down the form he has scrolled.
- Sheets use `overscroll-behavior: contain`, so scrolling to the end of a form does not
  start dragging the page underneath it.

## Working without signal

Building sites have bad reception, so the app doesn't depend on it:

- The last loaded data is cached on the phone, so it opens and shows everything offline.
- A new or edited entry is saved locally first and queued. A banner shows how many
  entries are waiting.
- The queue is sent when the phone comes back online, and again on next open.
- Rows carry a client-generated UUID, so a retried send can't create a duplicate.

What this does **not** survive: deleting the app's site data, or a phone lost before it
next gets signal. The data itself lives in Supabase, so nothing is trapped in the phone:
**Supabase dashboard → Table Editor → entries → Export → CSV** gives you the lot whenever
you want it.

## Likely next things

- **Receipt photos** — Supabase Storage, a bucket per job. Most valuable once he needs
  them to justify costs to a client.
- **A contract value per job** — he bills as costs come up today, but if a job ever gets
  a fixed price, an optional field would let the Report show "received 60% of contract,
  spent 80% of it" while there is still time to react.
- **Client totals across jobs** — jobs carry the client as plain text for now. If the same
  parties come back, a proper clients table would give a balance per person.
- **A "what I owe" list** — only if he starts buying on credit. He pays immediately today.
