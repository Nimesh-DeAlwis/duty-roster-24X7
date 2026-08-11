-- Run this in Supabase SQL Editor if your "staff" table was created before
-- the Employee Master feature was added. Safe to run even if columns exist
-- (IF NOT EXISTS guards against errors).

alter table staff add column if not exists employee_id text;
alter table staff add column if not exists phone text;
alter table staff add column if not exists email text;
