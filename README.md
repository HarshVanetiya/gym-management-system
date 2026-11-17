# Medilife Fitness Club — website, member app & gym manager

Built for **Medilife Fitness Club (MFC), Kashipuri Colony, Udaipur**. Designed mobile-first and installable as an app (PWA).

**Design.** Two palettes, each with light and dark versions, defined as CSS variables at the top of `src/app/globals.css`:
- Website and login page: quiet **navy and white** (navy `#0a1730`, one muted blue `#2c5bd0` for small accents), thin
  lines instead of boxes, and the club name set as a lockup: "MEDILIFE" in spaced serif capitals over a small
  "FITNESS CLUB" (`src/components/Brand.tsx`). When the gym uploads its own logo (Dashboard → Website → Logo), the
  logo replaces the lockup in the website header and footer.
- Dashboards (trainer dashboard, member app): neutral greys with hairline borders and no shadows, near-black buttons, and colour only for status. Navy appears in the logo mark and the membership card.

Type: Cormorant Garamond for website headings, Inter for text and for the dashboards, JetBrains Mono for numbers. All fonts are bundled, so they also work offline.

The website shows no prices: visitors book a free trial or ask for a call back, and membership plans stay in the
dashboard. It does show whether the gym is **open right now** (India time, read from the opening-hours text,
`src/lib/hours.ts`) and today's hours.

A complete web system for a personal trainer / small gym, built with **Next.js (React) + Supabase**.
The public website is rendered on the server, so search engines see the full page and the gym shows up as a local business (structured data).
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

Open http://localhost:3000. With no Supabase keys, the app runs in **demo mode**: sample data is stored
in your browser, and the login page has one-click buttons for **Trainer** and **Member** logins.

## Connect a real Supabase project

1. Create a free project at supabase.com. The Mumbai region (`ap-south-1`) is closest for India.
2. **SQL Editor** → paste and run `supabase/schema.sql`, then (optional) `supabase/seed.sql`.
3. **Authentication → Providers → Email**: keep **Confirm email ON**. Members are linked to their
   gym record by email, so confirmation proves they own that email.
4. **Authentication → URL Configuration**: set Site URL to your website (e.g. `https://yourgym.in`).
5. **Authentication → Emails → SMTP**: add a free SMTP provider (Brevo/Resend). The built-in sender
   is heavily rate-limited.
6. Copy `.env.example` to `.env` and fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
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

### Member profile (phone + photo)
Members open **Profile** in the member app to change their mobile number and upload a photo. Everything else
(name, email, plans, payments) stays trainer-only: the database only lets a member change those two fields on
their own record (`update_my_profile` in `schema.sql`). The trainer can also add or change a member's photo from
the member's page.

## Photos on Cloudinary

Member photos and the website's logo, main photo and gallery are stored on **Cloudinary**, not in Supabase.

1. Create a free Cloudinary account. The dashboard shows the **cloud name**, **API key** and **API secret**.
2. Add them to `.env` (and to your host's environment variables):
   `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
3. That's it. No upload preset is needed.

How it works:
- **Smaller uploads:** the browser shrinks each photo first (members 640 px, logo 800 px, gallery 1600 px, main photo 2000 px).
  Logos keep their see-through background (PNG), and SVG logos are uploaded as they are.
- **Signed uploads:** `/api/upload-signature` checks who is logged in, then signs the upload. The API secret never
  reaches the browser.
- **Who can upload what:** members can only replace their own photo. The trainer can upload member photos and website photos.
- **No piling up:** each photo has a fixed slot (`mfc/members/<member id>`, `mfc/site/logo`, `mfc/site/hero`, `mfc/site/gallery-1…5`),
  so a new upload replaces the old file.
- **Smaller downloads:** photos are shown through Cloudinary transformations (`f_auto,q_auto` plus the exact size needed).

In demo mode, photos are kept as small copies inside the browser instead.

## Backup and moving to a new Supabase account

**Dashboard → More → Backup & data** has the following:

- **Download backup.** Saves one `mfc-backup-<date>.json.gz` file with every table: members, memberships,
  payments, attendance, progress, plans, workouts, diets, enquiries, testimonials and website settings.
  The file is gzip-compressed JSON, so it's about 6× smaller than plain JSON. 5 years of a 300-member gym is about 8 MB.
- **Restore from backup.** Shows what's in the file, asks you to confirm, then replaces all data and shows a progress bar.
  If the connection drops halfway, run it again with the same file: rows keep their ids, so it finishes cleanly.
- **Storage** shows the database size against the free 500 MB, and roughly how many years are left.
- **Clean up** removes check-ins and closed enquiries older than 1 to 5 years. Members, payments, memberships
  and progress are never removed.

**Moving to a new Supabase project:**
1. Old site: **Download backup**.
2. New Supabase project: run `supabase/schema.sql`. You don't need `seed.sql`.
3. Point the app at the new project (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and redeploy.
4. Sign up with the trainer's email and make it admin (step 7 above).
5. **Backup & data → Restore**, then choose the file. Done.

**Not inside the file:**
- **Logins (passwords):** they belong to the old project's Supabase Auth. Members simply **sign up again with the same email**,
  and the database re-links them to their records automatically.
- **Photos:** they stay on Cloudinary, and their links in the backup keep working.

Separately, the GitHub Actions workflow below keeps a nightly database dump as a second safety net.

## Deploy (free)

Next.js needs a host that runs a small server (for the server-rendered home page). Free options that allow a business site:

- **Netlify (easiest).** Import the GitHub repo, and it detects Next.js automatically. Add the environment variables
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The free plan is 300 credits/month (a hard cap: sites pause
  if exceeded), which is plenty for one gym's traffic.
- **Cloudflare Workers** via the [OpenNext adapter](https://opennext.js.org/cloudflare): free plan has 100k requests/day and a
  3 MiB (compressed) size limit. More setup than Netlify. Not yet tested with this project.
- **Any VPS:** `npm run build && npm start` (port 3000) behind Nginx/Caddy.

> Vercel is the company behind Next.js, but its free Hobby plan is for non-commercial use only, so a business site there needs Vercel Pro ($20/month).

## Install as an app (PWA)

The site is a Progressive Web App:
- **Android / Chrome:** an **Install** button appears on the website, in the member app and in the trainer's "More" menu.
- **iPhone:** Safari → Share → **Add to Home Screen** (the button shows these steps).
- The installed app opens on **My plan** (`/me`); trainers are sent to their dashboard after login.
- Works on a weak connection: pages and fonts are cached by `public/sw.js`; member data is always fetched live.

Before launch, fill in the real details under **Dashboard → Website**: the gym's logo, phone, WhatsApp, opening hours
(e.g. `Mon–Sat 5:30 AM – 10 PM · Sun 7 AM – 12 PM`), a short tagline (the big line at the top of the site), a main
photo and gallery photos, and real member reviews. Plan prices are set under **Plans** and are used for memberships only. Fields left empty are hidden on the site. The sample reviews are labelled "Sample review" until replaced.

## Reliability extras (recommended)

- **Nightly backup**: `.github/workflows/db-backup.yml` dumps the database daily to GitHub Actions
  artifacts. Add a repo secret `SUPABASE_DB_URL` (Supabase → Connect → Session pooler string).
  This also keeps the free project from being paused for inactivity.
- **India ISP block workaround**: `supabase/cloudflare-proxy-worker.js` puts Supabase behind your own
  domain. Then set `NEXT_PUBLIC_SUPABASE_URL` to that domain.

## Project structure

```
src/
  app/                Next.js routes (pages and layouts)
  lib/store.ts        data layer: Supabase or in-browser demo, same interface
  lib/types.ts        table types
  lib/utils.ts        dates, money, member status, WhatsApp links, CSV
  lib/seed.ts         demo data
  lib/public-data.ts  data for the public site (loaded on the server)
  views/Home.tsx      public portfolio site
  views/Login.tsx
  views/admin/*       trainer dashboard
  views/member/*      member app
supabase/
  schema.sql          tables, triggers, row-level security
  seed.sql            starter plans/programs
  cloudflare-proxy-worker.js
docs/SOLUTIONS.md     hosting options, costs, add-ons
demo-slides/          click-through presentation (open demo-slides/index.html)
```
