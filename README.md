# Duty Roster

A small web app that does exactly what you described:

- Pick a start date, it auto-generates the 7 date columns + weekday names (like your screenshots).
- Two table styles, switchable with a button:
  - **Shift** — one row, e.g. `Nimesh (7.30pm - 11.00pm)` (like image 1)
  - **Dedicated + Standby** — three rows: Dedicated Person / Stand by Person 1 / Stand by Person 2 (like image 2)
- Type names straight into the cells, or hit **Auto-fill week** to cycle through your staff list in order (round robin) — you can still edit any cell after.
- **Download as PNG** — exports the table exactly as styled, ready to send.
- Everything is saved to **Supabase** (staff list + every saved week), so nothing is lost and you can reopen old weeks.
- Deploys free on **Vercel**.

---

## 1. Set up Supabase (5 min)

1. Go to https://supabase.com → create a free account → **New project**.
2. Once it's created, open **SQL Editor** → **New query**.
3. Paste the contents of `supabase/schema.sql` (in this folder) and click **Run**.
   This creates two tables (`staff`, `rosters`) and seeds a starter staff list — edit/remove
   names there as needed.
4. Go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key

---

## 2. Run it locally (optional, to test before deploying)

```bash
npm install
cp .env.local.example .env.local
# paste your Supabase URL + anon key into .env.local
npm run dev
```

Open http://localhost:3000

---

## 3. Deploy to Vercel

**Easiest path — GitHub + Vercel:**

1. Push this folder to a new GitHub repo (Vercel deploys straight from GitHub):
   ```bash
   git init
   git add .
   git commit -m "duty roster app"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/duty-roster.git
   git push -u origin main
   ```
2. Go to https://vercel.com → **Add New → Project** → import that GitHub repo.
3. In the **Environment Variables** step, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy**. Vercel gives you a live `.vercel.app` URL in about a minute.

Any time you push to `main`, Vercel redeploys automatically.

---

## Notes / things worth knowing

- **Security**: the SQL script uses open read/write policies so the app works immediately
  with just the anon key (fine for an internal tool not linked anywhere public). If you want
  a login screen before anyone can edit, say so and I can add Supabase Auth (email/password)
  with proper row-level-security policies — that's a natural next step.
- **PNG export** uses the `html-to-image` library on the actual table DOM, so the download
  matches the on-screen styling (green date header, tan standby rows, etc.) pixel for pixel.
- **Staff list** feeds the auto-fill rotation and lives in the `staff` table — add/remove people
  any time from the "Staff list" panel in the app.
- **Multiple teams**: if you eventually need separate rosters for different clients
  (Wingshop Cambodia vs K'FAE vs Coffee Hub, for example), the simplest extension is adding a
  `location` column to `rosters` and a filter dropdown — easy to add later.

## Ideas for more features (not built yet, tell me if you want any)

- Email/WhatsApp the week's roster automatically every Sunday night.
- Conflict checking (warn if the same person is dedicated 2 days in a row).
- Multi-location tabs (Sri Lanka branches, Cambodia outlets) in one dashboard.
- Login screen so only your team can edit.
- Print-friendly / A4 PDF export in addition to PNG.
