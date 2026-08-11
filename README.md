# Duty Roster

Full internal scheduling tool: login-protected, brand-colored, with a dashboard,
employee master, roster archive with preview, copy/duplicate tools, and drag & drop.

## What's new in this version

- **Brand color** — theme now uses `#083344` (dark teal) throughout, with your
  24×7 Retail logo in the top bar and login screen.
- **Dashboard** (`/`) — total people scheduled today, Extend/Evening roster counts,
  today's Dedicated Person / Standby 1 / Standby 2, upcoming saved roster count,
  active staff count, and quick-action buttons.
- **Create Roster** (`/roster`) — the editor, now with:
  - **Copy & duplicate tools**: copy the day before this week into Monday, copy
    last week's whole roster, or duplicate this week to a different date range
    (saves it as a brand-new roster automatically).
  - **Drag & drop**: drag a staff chip straight onto a roster cell to assign them;
    drag a filled cell's ⋮⋮ handle to move that person to another slot
    (Dedicated ↔ Standby 1 ↔ Standby 2) or to a different date.
- **Old Rosters** (`/roster?view=archive`) — search/filter archive; **Preview**
  opens the roster as a popup with the same styled heading as the download, plus
  a **Download as PNG** button and an **Edit this roster** button.
- **Employee Master** (`/employees`) — add, edit, and remove employees with
  name, employee ID, phone, and email. This list feeds both roster types' staff
  chips and auto-fill rotation.
- **Login screen** — unchanged credentials:
  - Username: `PROJECTADMIN`
  - Password: `ADMIN2026@247`

---

## 1. Supabase — run the migration if upgrading an existing project

If your Supabase project already has the `staff` and `rosters` tables from
before, you only need to add the new Employee Master columns:

SQL Editor → New query → paste `supabase/migration_v2_employee_master.sql` → Run.

(It uses `IF NOT EXISTS`, so it's safe to run even twice.)

Brand new Supabase project? Just run `supabase/schema.sql` — it doesn't yet include
the new columns, so also run the migration file right after.

## 2. Environment variables

No changes from before — same four values in `.env.local` / Vercel:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
| `ADMIN_USERNAME` | `PROJECTADMIN` |
| `ADMIN_PASSWORD` | `ADMIN2026@247` |
| `SESSION_TOKEN` | any long random string (see `.env.local.example`) |

## 3. Run locally (optional)

```bash
npm install
npm run dev
```

## 4. Deploy

```bash
git add .
git commit -m "Add dashboard, employee master, copy tools, drag & drop, branding"
git push
```

Vercel redeploys automatically from GitHub. No new environment variables are
needed for this update — just the Supabase migration above.

---

## Notes on the copy/duplicate tools

- **Copy previous day → Monday**: looks for a saved roster (same type) covering
  the day right before your selected week starts, and copies just that single
  day's assignments into this week's Monday.
- **Copy last week's roster**: looks for a saved roster (same type) starting
  exactly 7 days earlier, and copies its whole week in, matched by weekday.
- **Duplicate this week to another date range**: takes whatever is currently on
  screen (typed, auto-filled, or drag-and-dropped) and saves it as a brand-new
  roster starting on whatever date you pick — handy for "same people, different
  week."

## Notes on drag & drop

- Staff chips in the "Staff list" panel are draggable — drop one on any roster
  cell to fill it in (Extend Roster cells automatically get the default duty
  time appended).
- Any filled cell shows a small ⋮⋮ handle — drag that handle to another cell to
  move that person (works between Dedicated/Standby rows on the same day, or
  across different dates).

## Ideas for more features (not built yet)

- Email/WhatsApp auto-send of the week's roster.
- Conflict warnings (same person scheduled two days running).
- Multi-location tabs (Sri Lanka branches vs Cambodia outlets).
- Per-user login accounts instead of one shared admin login.
