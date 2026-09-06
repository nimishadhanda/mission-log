-- Mission Log — Supabase schema
-- Run this once in your Supabase project's SQL Editor (Dashboard → SQL Editor → New query → Run).

create table if not exists mission_log (
  id text primary key,
  completions jsonb not null default '{}'::jsonb,
  rewards jsonb not null default '{"balance": 2500, "ledger": []}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seed the single shared row with everything Moksh has already done so far
-- (carried over from the current Mission Log), so nothing is lost.
insert into mission_log (id, completions, rewards)
values (
  'default',
  '{"2026-08-31|water":{"submitted":true,"approved":true},"2026-08-31|olympiad":{"submitted":true,"approved":true},"2026-08-31|football":{"submitted":true,"approved":true},"2026-08-31|ukulele":{"submitted":true,"approved":true},"2026-09-01|water":{"submitted":true,"approved":true},"2026-09-01|olympiad":{"submitted":true,"approved":true},"2026-09-01|sc":{"submitted":true,"approved":true},"2026-09-01|cricket":{"submitted":true,"approved":true},"2026-09-02|olympiad":{"submitted":true,"approved":true},"2026-09-02|ukulele":{"submitted":true,"approved":true},"2026-09-03|cricket":{"submitted":true,"approved":true},"2026-09-03|olympiad":{"submitted":true,"approved":true},"2026-09-03|sc":{"submitted":true,"approved":true},"2026-09-03|water":{"submitted":true,"approved":true},"2026-09-02|water":{"submitted":true,"approved":true},"2026-09-02|feet":{"submitted":true,"approved":true},"2026-09-05|sleep":{"submitted":true,"approved":true},"2026-08-31|sleep":{"submitted":true,"approved":true},"2026-09-01|sleep":{"submitted":true,"approved":true},"2026-09-02|sleep":{"submitted":true,"approved":true},"2026-09-03|sleep":{"submitted":true,"approved":true},"2026-09-04|sleep":{"submitted":true,"approved":true},"2026-08-31|feet":{"submitted":true,"approved":true},"2026-08-31|brush":{"submitted":true,"approved":true},"2026-08-31|dinner":{"submitted":true,"approved":true},"2026-09-05|robotics":{"submitted":true,"approved":true},"2026-09-05|ukuleleclass":{"submitted":true,"approved":true},"2026-09-01|dinner":{"submitted":true,"approved":true},"2026-09-02|football":{"submitted":true,"approved":true},"2026-09-03|dinner":{"submitted":true,"approved":true},"2026-09-04|olympiad":{"submitted":true,"approved":true},"2026-09-04|ukulele":{"submitted":true,"approved":true},"2026-09-04|dinner":{"submitted":true,"approved":true},"2026-09-05|sc":{"submitted":true,"approved":true},"2026-09-05|water":{"submitted":true,"approved":true},"2026-09-04|water":{"submitted":true,"approved":true},"2026-09-02|dinner":{"submitted":true,"approved":true},"2026-09-05|dinner":{"submitted":true,"approved":true}}'::jsonb,
  '{"balance": 2500, "ledger": []}'::jsonb
)
on conflict (id) do nothing;

-- Enable row level security, then allow the app's public "anon" key to read
-- and write the shared row. There's no login system here — anyone with your
-- deployed app's URL can use it, the same trust model as a private link.
alter table mission_log enable row level security;

drop policy if exists "Allow anon read" on mission_log;
create policy "Allow anon read" on mission_log
  for select using (true);

drop policy if exists "Allow anon update" on mission_log;
create policy "Allow anon update" on mission_log
  for update using (true);

-- Needed so the browser can subscribe to live updates (e.g. Mom approves on
-- her laptop, Moksh's iPad updates automatically).
alter publication supabase_realtime add table mission_log;
