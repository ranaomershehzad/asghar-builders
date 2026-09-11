-- Migration 001 — track quantities on money-out entries.
--
-- Run this ONCE in the Supabase dashboard (SQL Editor -> New query) on a
-- project that already has the original schema. A fresh project created
-- from schema.sql already has these columns and does not need this file.
--
-- Adds: what was bought, how much of it, and in what unit — so the app can
-- answer "how many bags of cement have gone into this house".

alter table public.entries add column if not exists item     text;
alter table public.entries add column if not exists quantity numeric(12, 3) check (quantity is null or quantity > 0);
alter table public.entries add column if not exists unit     text;

-- Grouping is done on the lower-cased item name, so "Cement" and "cement"
-- count as one thing.
create index if not exists entries_item_idx on public.entries (job_id, lower(item));
