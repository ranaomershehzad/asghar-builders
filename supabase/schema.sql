-- Asghar Builders — database schema
-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- If you already ran an earlier version of this file, uncomment these three
-- lines and run them first. They destroy everything in those tables.
--
-- drop table if exists public.entries;
-- drop table if exists public.expenses;
-- drop table if exists public.houses;

-- ---------------------------------------------------------------
-- 1. Who is allowed in
-- ---------------------------------------------------------------
-- Only people listed in `members` can read or write anything. Sign-ups
-- are disabled in the dashboard, so accounts are created by hand and
-- then added here. See README step 4.

create table if not exists public.members (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  name       text,
  created_at timestamptz not null default now()
);

-- SECURITY DEFINER so the policies below can check membership without
-- needing a policy on `members` itself (which would recurse).
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.members where user_id = auth.uid());
$$;

revoke all on function public.is_member() from public;
grant execute on function public.is_member() to authenticated;

alter table public.members enable row level security;

drop policy if exists members_read_self on public.members;
create policy members_read_self on public.members
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------
-- 2. Jobs — one row per site
-- ---------------------------------------------------------------
-- kind 'client' = building for someone else, who pays in instalments.
-- kind 'own'    = he bought the land himself and will sell it.
-- Both are just a site with money coming in and money going out.

create table if not exists public.jobs (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) > 0),
  client     text,
  kind       text not null default 'client' check (kind in ('client', 'own')),
  status     text not null default 'Active'
             check (status in ('Active', 'On hold', 'Finished')),
  notes      text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null
);

-- ---------------------------------------------------------------
-- 3. Entries — the ledger. Every rupee in or out, one row each.
-- ---------------------------------------------------------------
-- direction 'in'  = money received (an advance from the party, or a sale)
-- direction 'out' = money paid (materials, labour, land, or his own drawings)
--
-- Balance for a job = sum(in) - sum(out).
--   Positive on a client job: he is holding the party's money.
--   Negative on a client job: he has paid out of his own pocket.
--   On an own build: the balance is the profit once it sells.

create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.jobs (id) on delete cascade,
  direction   text not null check (direction in ('in', 'out')),
  entry_date  date not null default current_date,
  category    text not null,
  description text,
  amount      numeric(14, 2) not null check (amount > 0),
  party       text,
  method      text not null default 'Cash' check (method in ('Cash', 'Bank', 'Card')),
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users (id) on delete set null,

  -- Categories are fixed here so they can't drift. Keep this list in step
  -- with IN_CATEGORIES / OUT_CATEGORIES in src/types.ts — change one and
  -- you must change the other, or inserts get rejected.
  constraint entries_category_matches_direction check (
    (direction = 'in' and category in
      ('Advance', 'Progress payment', 'Final payment', 'Sale', 'Other'))
    or
    (direction = 'out' and category in
      ('Materials', 'Labour', 'Subcontract', 'Permits', 'Equipment',
       'Utilities', 'Land', 'My drawing', 'Other'))
  )
);

create index if not exists entries_job_date_idx
  on public.entries (job_id, entry_date desc);

-- ---------------------------------------------------------------
-- 4. Row level security — members see and edit everything, others nothing
-- ---------------------------------------------------------------
alter table public.jobs    enable row level security;
alter table public.entries enable row level security;

drop policy if exists jobs_member_all on public.jobs;
create policy jobs_member_all on public.jobs
  for all to authenticated
  using (public.is_member())
  with check (public.is_member());

drop policy if exists entries_member_all on public.entries;
create policy entries_member_all on public.entries
  for all to authenticated
  using (public.is_member())
  with check (public.is_member());

-- ---------------------------------------------------------------
-- 5. Add the two people (edit the emails, then run these two lines)
-- ---------------------------------------------------------------
-- insert into public.members (user_id, name)
--   select id, 'Asghar' from auth.users where email = 'uncle@example.com'
--   on conflict (user_id) do nothing;
--
-- insert into public.members (user_id, name)
--   select id, 'Manager' from auth.users where email = 'you@example.com'
--   on conflict (user_id) do nothing;
