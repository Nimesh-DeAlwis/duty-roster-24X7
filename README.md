# Duty Roster

Internal scheduling tool for Wing24x7: two-tier login, a live dashboard, drag-and-drop
roster editing with multiple staff per slot, an employee master, roster copy/duplicate
tools, and a full audit log — backed by Supabase, deployed on Vercel.

## What's in this version

- **Two login roles**:
  - **Admin** (`PROJECTADMIN` / `ADMIN2026@247`) — full access: Dashboard, Create Roster,
    Old Rosters, Employee Master, Audit Log.
  - **Staff viewer** (`24x7USER` / `247ADMIN`) — Dashboard and Old Rosters (read-only)
    only. Create Roster, Employee Master, and Audit Log are hidden from the menu and
    blocked at the routing level even if the URL is typed directly.
- **Dashboard** (`/`) — live stats (people scheduled today, upcoming rosters, active
  staff, today's Dedicated Person) plus this week's actual Extend Roster and Evening
  Roster tables rendered inline, each downloadable as PNG.
- **Roster editor** (`/roster`) — Extend Roster (single row) and Evening Roster
  (Dedicated + Standby 1 + Standby 2), with:
  - **Multiple staff per slot** — drop or type more than one name into any cell; each
    shows as a removable chip.
  - **Drag & drop** — built on pointer events (not the native HTML5 drag API, which is
    unreliable across browsers), so it works consistently with mouse, trackpad, and touch.
    Drag a staff chip onto any cell, or drag a chip already in the table to move it to
    another slot or date.
  - **Copy & duplicate** — copy the day before this week into Monday, copy last week's
    whole roster in, or duplicate this week to a different date range as a new roster.
  - **PNG export** — captures the full table width even when it's wider than the visible
    scroll area (this was the "half image" bug — fixed by measuring the table's actual
    scrollWidth/scrollHeight before capturing, instead of just what's on screen).
- **Old Rosters archive** — search/filter, and **Preview** opens a popup with the same
  styled heading as the download, a Download button, and (admin only) an Edit button.
- **Employee Master** (`/employees`, admin only) — name, employee ID, role (Employee /
  Team Leader / Supervisor / Manager / Admin — a label only, see note below), designation,
  department, phone, email, and active/inactive status.
- **Audit Log** (`/audit`, admin only) — every roster created, edited, or deleted is
  recorded with who did it and what changed, cell by cell (previous assignment → new
  assignment).
- **Login screen** — dark teal branding with a subtle repeating icon watermark and a
  large faded logo behind the card.

## A note on scope — what this is *not* (yet)

Two things you asked about are bigger than a feature bolt-on and deserve their own proper
build rather than a half-working stub:

- **Individual employee login accounts with password reset.** Right now there are two
  *shared* logins (Admin / Staff viewer) — not one account per employee. Real per-person
  accounts need an actual auth backend (Supabase Auth is the natural fit) with signup,
  password reset emails, and session management. The "Role" field in Employee Master
  today is just a label for your own reference — it doesn't grant or restrict anything.
- **Leave approval history and attendance modifications.** These need their own data
  model (leave requests with approval states, attendance/clock-in records) that doesn't
  exist anywhere in the app yet. Happy to scope this as the next build.

## 1. Supabase setup

**Brand new project:** SQL Editor → New query → paste `supabase/schema.sql` → Run. That's
everything in one shot (staff, rosters, audit_log, all columns, policies, seed data).

**Upgrading an existing project:** run whichever of these you haven't yet, in order:
1. `supabase/migration_v2_employee_master.sql` — employee_id/phone/email on staff
2. `supabase/migration_v3_employee_fields.sql` — designation/department/role on staff
3. `supabase/migration_v4_audit_log.sql` — the audit_log table

All migrations use `IF NOT EXISTS` / safe `CREATE`, so re-running one you've already
applied won't error.

## 2. Environment variables

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
| `ADMIN_USERNAME` | `PROJECTADMIN` |
| `ADMIN_PASSWORD` | `ADMIN2026@247` |
| `ADMIN_SESSION_SECRET` | long random string — see `.env.local.example` |
| `STAFF_USERNAME` | `24x7USER` |
| `STAFF_PASSWORD` | `247ADMIN` |
| `STAFF_SESSION_SECRET` | a **different** long random string from the admin one |

Set these in `.env.local` for local testing and in Vercel → Project → Settings →
Environment Variables for the live site. After adding/changing them in Vercel, redeploy
from the Deployments tab so they take effect.

## 3. Run locally (optional)

```bash
npm install
npm run dev
```

## 4. Deploy

```bash
git add .
git commit -m "Fix PNG export, robust drag-drop, watermark login, two-role access, employee master, audit log"
git push
```

Vercel redeploys automatically. Add the new environment variables above in the Vercel
dashboard, then trigger a redeploy so they're picked up.

## Security note on the two login roles

The role check happens at the app's edge (middleware) and in the UI, which keeps an
internal team's day-to-day usage clean and prevents the Staff-viewer account from
navigating into edit screens. It is **not** database-level enforcement — the Supabase
`anon` key used by this app has open read/write policies on all tables (chosen for
simplicity), so it doesn't cryptographically stop someone from calling Supabase directly
with dev tools. For a small trusted internal team this is a reasonable tradeoff; if this
ever needs to hold up against a hostile actor, the next step would be real per-role Row
Level Security policies tied to Supabase Auth.
