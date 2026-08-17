-- Run this in Supabase SQL Editor to add the Audit Log feature.

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  roster_id uuid,
  roster_title text,
  action text not null check (action in ('created', 'updated', 'deleted')),
  actor text,
  changes jsonb default '[]',
  created_at timestamptz default now()
);

alter table audit_log enable row level security;

drop policy if exists "public read audit_log" on audit_log;
create policy "public read audit_log" on audit_log for select using (true);
drop policy if exists "public write audit_log" on audit_log;
create policy "public write audit_log" on audit_log for insert with check (true);
