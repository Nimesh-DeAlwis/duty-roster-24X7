-- Run this in Supabase SQL Editor. Safe to run even if columns already exist.

alter table staff add column if not exists designation text;
alter table staff add column if not exists department text;
alter table staff add column if not exists role text default 'Employee';
