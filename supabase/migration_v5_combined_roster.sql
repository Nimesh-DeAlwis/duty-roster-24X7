-- Run this once in Supabase Dashboard -> SQL Editor.
-- Adds the new "combined" roster type (Extend + Evening merged into one
-- weekly roster / one exported image) alongside the existing "shift" and
-- "dedicated" types, which are kept so older saved rosters keep working.

alter table rosters drop constraint if exists rosters_roster_type_check;
alter table rosters add constraint rosters_roster_type_check
  check (roster_type in ('shift', 'dedicated', 'combined'));
