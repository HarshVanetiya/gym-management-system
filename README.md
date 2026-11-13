# Gym Management System

A complete web system for a personal trainer / small gym, built with **React + Supabase**.
It has three parts in one app:

| Part | Who | What |
|---|---|---|
| **Public website** (`/`) | Anyone | Portfolio: about the coach, programs, pricing, transformations, enquiry form, WhatsApp button |
| **Trainer dashboard** (`/admin`) | Trainer | Members, subscriptions & renewals, offline payments & dues, attendance, workout & diet templates, enquiries, website editor, CSV export, WhatsApp reminders |
| **Member app** (`/me`) | Members | Membership status & days left, today's workout, weekly schedule, diet plan, progress log, payment history |

No payment gateway: payments are made offline (cash / UPI) and the trainer records them.
Options, costs and add-ons (including payment gateways) are in **[docs/SOLUTIONS.md](docs/SOLUTIONS.md)**.

## Run the demo (no setup)

```bash
npm install
npm run dev
```

Open http://localhost:5173. With no Supabase keys, the app runs in **demo mode**: sample data is stored
in your browser, and the login page has one-click buttons for **Trainer** and **Member** logins.

## Connect a real Supabase project

1. Create a free project at supabase.com. The Mumbai region (`ap-south-1`) is closest for India.
2. **SQL Editor** → paste and run `supabase/schema.sql`, then (optional) `supabase/seed.sql`.
3. **Authentication → Providers → Email**: keep **Confirm email ON**. Members are linked to their
   gym record by email, so confirmation proves they own that email.
4. **Authentication → URL Configuration**: set Site URL to your website (e.g. `https://yourgym.in`).
5. **Authentication → Emails → SMTP**: add a free SMTP provider (Brevo/Resend). The built-in sender
   is heavily rate-limited.
6. Copy `.env.example` to `.env` and fill `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API).
7. `npm run dev`, go to `/login`, **sign up with the trainer's email**, confirm it, then in the SQL Editor run:
   ```sql
   update public.profiles set role = 'admin' where email = 'trainer@example.com';
   ```
8. Log in again and you're the admin.

### How members get access
1. The trainer adds the member with their **email** (Members → Add member).
2. The member opens `/login` → "Create an account" with that same email, and confirms it.
3. A database trigger links the account to the member, and they see their plan, workout and diet.

Security is enforced in the database with Row Level Security (see `schema.sql`). Members can only
read their own records, and only the admin can change memberships, payments and programs.

## Deploy (free)

**Cloudflare Pages** (commercial use is allowed on the free plan):
- Build command `npm run build`, output directory `dist`.
- Add environment variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- `public/_redirects` already handles SPA routing. Netlify uses the same file.

> Vercel's free Hobby plan is for non-commercial use only, so a business site needs Vercel Pro.

## Reliability extras (recommended)

- **Nightly backup**: `.github/workflows/db-backup.yml` dumps the database daily to GitHub Actions
  artifacts. Add a repo secret `SUPABASE_DB_URL` (Supabase → Connect → Session pooler string).
  This also keeps the free project from being paused for inactivity.
- **India ISP block workaround**: `supabase/cloudflare-proxy-worker.js` puts Supabase behind your own
  domain. Then set `VITE_SUPABASE_URL` to that domain.

## Project structure

```
src/
  lib/store.ts        data layer: Supabase or in-browser demo, same interface
  lib/types.ts        table types
  lib/utils.ts        dates, money, member status, WhatsApp links, CSV
  lib/seed.ts         demo data
  pages/Home.tsx      public portfolio site
  pages/Login.tsx
  pages/admin/*       trainer dashboard
  pages/member/*      member app
supabase/
  schema.sql          tables, triggers, row-level security
  seed.sql            starter plans/programs
  cloudflare-proxy-worker.js
docs/SOLUTIONS.md     hosting options, costs, add-ons
```
