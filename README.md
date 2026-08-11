# Duty Roster

A weekly duty roster tool with a login screen, two roster formats, a Supabase
backend, and one-click PNG export — deployable free on Vercel.

## What's in this version

- **Login screen** — nothing is visible until signing in.
  - Username: `PROJECTADMIN`
  - Password: `ADMIN2026@247`
  - (Change these any time in your environment variables — see below. They are
    never sent to the browser; the check happens on the server.)
- **Two roster types**, switchable with a pill toggle at the top:
  - **Extend Roster** — one row per day, e.g. `Nimesh (7.30pm - 11.00pm)`. No standby rows.
  - **Evening Roster** — three rows: Dedicated Person / Stand by Person 1 / Stand by Person 2.
- **Auto date generation** — pick a start date, the 7 date + weekday columns build themselves.
- **Auto-fill (round robin)** — cycles your staff list into any row automatically; still editable by hand after.
- **PNG export with heading** — the downloaded image includes an "Extend Roster" or
  "Evening Roster" title + the date range above the table, not just the bare grid.
- **Roster archive** — "Old rosters" button opens a searchable, filterable grid of every
  roster you've ever saved (filter by type, search by title), with Open/Delete per card.
- **Modern UI** — dark green branded top bar, card-based layout, pill toggles, rounded corners.

---

## 1. Supabase — already set up

If you ran `supabase/schema.sql` before, **nothing needs to change** — Extend/Evening reuse
the same `shift` / `dedicated` values under the hood, just relabelled in the interface.
Skip straight to step 2.

If this is a fresh Supabase project: SQL Editor → New query → paste `supabase/schema.sql` → Run.

## 2. Environment variables

Copy `.env.local.example` to `.env.local` for local testing, or set these directly in Vercel
(Project → Settings → Environment Variables) for the live site:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your Supabase anon public key |
| `ADMIN_USERNAME` | `PROJECTADMIN` (or your own) |
| `ADMIN_PASSWORD` | `ADMIN2026@247` (or your own) |
| `SESSION_TOKEN` | any long random string — used to sign the login session. One is pre-filled in `.env.local.example`; generate your own with `openssl rand -hex 32` if you'd rather. |

**Never commit `.env.local` to GitHub** — it's already listed in `.gitignore`. On Vercel,
paste these values into the dashboard directly instead.

## 3. Run locally (optional)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you'll land on the login screen first.

## 4. Deploy / redeploy on Vercel

If already connected to your GitHub repo, just:

```bash
git add .
git commit -m "Add login, extend/evening rosters, archive, new UI"
git push
```

Vercel redeploys automatically. If the four new environment variables
(`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `SESSION_TOKEN`, plus the existing Supabase ones)
aren't already set in the Vercel dashboard, add them under
**Project → Settings → Environment Variables**, then **Redeploy** from the Deployments tab
so the new variables take effect.

---

## Notes

- The login is a simple shared username/password for the team, checked server-side via a
  Next.js API route, with an httpOnly session cookie (7-day expiry). It's appropriate for an
  internal tool but isn't per-user accounts — if you later want individual logins per staff
  member, that's a natural next step (Supabase Auth).
- The `staff` table still feeds the auto-fill rotation for both roster types.
- Want more? Ideas not yet built: auto-send the week's roster by email/WhatsApp, warn if the
  same person is scheduled two days running, or separate tabs per location (Sri Lanka branches
  vs Cambodia outlets).
