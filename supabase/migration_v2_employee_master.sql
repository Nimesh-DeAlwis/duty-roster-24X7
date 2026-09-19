-- Run in Supabase SQL Editor if your "staff" table already existed before
-- Employee Master was added. Safe to run more than once.

alter table staff add column if not exists employee_id text;
alter table staff add column if not exists phone text;
alter table staff add column if not exists email text;
