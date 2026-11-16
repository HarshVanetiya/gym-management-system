# Gym Management System: options, costs and add-ons

*Researched November 2026. Prices change often, so check every number on the vendor's own pricing page before quoting it. Most figures below come from vendor pages and third-party comparison sites, and the sources are linked at the end.*

**Exchange rate assumed:** $1 ≈ ₹90. Foreign SaaS bills paid by an Indian card may also carry **18% GST** and a **~3–3.5% forex markup** from the bank.

---

## 1. What the trainer needs

| Need | In the demo? |
|---|---|
| Track members and subscriptions (start/end, renewals, expiry alerts) | ✅ |
| Record offline payments (cash/UPI/card/bank), see dues | ✅ |
| Members log in to see their workout schedule and diet | ✅ |
| Public portfolio website with pricing, testimonials, enquiry form | ✅ |
| Website content editable by the trainer (no developer needed) | ✅ |
| Attendance check-in, progress (weight) tracking | ✅ |
| WhatsApp reminders (expiry, dues, enquiry follow-up) | ✅ free click-to-send links |
| CSV export (members, payments) | ✅ |
| Online payment gateway | ❌ optional, see section 4 |

---

## 2. How much data will the gym create? (measured)

We loaded this app's real database schema into PostgreSQL and filled it with **5 years of simulated gym activity**, then measured the actual size on disk, indexes included.

**Simulation:** about 300 active members at any time, with 40% leaving each year and being replaced (900 member records over 5 years). Each member makes about 16 visits a month, renews every ~2 months, and logs 2 weight entries a month. The website brings in 50 enquiries a month.

| Table | Rows after 5 years | Size (with indexes) | Per row |
|---|---|---|---|
| Attendance check-ins | 236,421 | 43 MB | ~192 bytes |
| Progress entries | 60,394 | 5.5 MB | ~94 bytes |
| Payments | 18,238 | 1.8 MB | ~100 bytes |
| Memberships (renewals) | 15,762 | 1.6 MB | ~102 bytes |
| Website enquiries | 6,000 | 0.6 MB | ~105 bytes |
| Members (incl. photo link) | 900 | 0.5 MB | ~546 bytes |
| Plans, programs, settings | a few | < 0.5 MB | n/a |
| **Total** | | **≈ 53 MB** | **≈ 10.6 MB a year** |

**What that means for Supabase Free (500 MB database):**

| Active members | Data added per year | Years until ~450 MB* |
|---|---|---|
| 150 | ~5 MB | 50+ |
| 300 | ~11 MB | ~40 |
| 600 | ~21 MB | ~20 |
| 1,000 | ~35 MB | ~12 |

\*Leaving ~50 MB for Supabase's own internal tables.

- **Members leaving and joining don't clutter the database.** A former member is one ~0.5 KB row plus their history. Even 10,000 people over the years would be about 5 MB. In the app, members whose plan ended more than 90 days ago move to a **Former** filter, so the default list stays short.
- **85% of the data is daily check-ins.** The trainer can clean these up in one click (**Backup & data → Clean up**, older than 1 to 5 years). Members, payments, memberships and progress are never removed. Keeping only 2 years of check-ins caps the database at roughly 20 to 40 MB for a 300-member gym.
- **The dashboard shows live usage** (**Backup & data → Storage**): the current size, the size of each table, and an estimate of years remaining.
- **Backup file size:** 5 years of data is about 50 MB as JSON. The app saves it gzip-compressed at about **8 MB**.
- Supabase Free also allows **50,000 monthly active users** for logins, which a single gym won't reach.

**Photos (Cloudinary Free: 25 credits a month, where 1 credit = 1 GB storage or 1 GB bandwidth or 1,000 transformations):**
- Member photos are shrunk to 640 px before upload (~60–120 KB each). **1,000 photos ≈ 0.1 GB ≈ 0.1 credit.**
- Photos are delivered resized and compressed (`f_auto,q_auto`). A list thumbnail is ~5–10 KB, and the website's main photo ~200–300 KB.
- For example, 3,000 website visits a month (~0.9 GB) plus app usage comes to about **1–3 credits a month, well inside 25.**
- Photos replace the previous file (fixed names), so storage doesn't grow with every re-upload.

---

## 3. Hosting options and running cost

### Option A: Supabase Free + Netlify Free *(this demo, recommended to start)*

| Item | Cost |
|---|---|
| Supabase Free (database + login) | ₹0 |
| Netlify Free (runs the Next.js site; commercial use allowed; 300 credits/month hard cap). Cloudflare Workers via OpenNext is a free alternative | ₹0 |
| Domain `.in` (renewal ≈ ₹899/yr at Hostinger) or `.com` (≈ ₹1,499/yr) | ₹900–1,500 / yr |
| Daily backup via GitHub Actions (included `.github/workflows/db-backup.yml`) | ₹0 |
| **Total** | **≈ ₹900–1,500 per year** (≈ ₹75–125/month) |

**Upsides:** costs almost nothing. You get real Postgres (SQL, reports, easy to move later). Login, security rules (RLS) and file storage are built in.

**Downsides and fixes:**
- **Free projects pause after 7 days with no activity.** A gym uses the app daily, and the nightly backup job also counts as activity, so this is unlikely to bite. If it does, one click resumes the project.
- **No downloadable backups on Free.** The included GitHub Actions workflow fixes this with a nightly `pg_dump`.
- **India access problem.** This is probably why your login sometimes fails. From **February 2026** several Indian ISPs (Jio, Airtel, ACT) blocked `*.supabase.co`. Reports say the block was through a government order or a DNS sinkhole. Access was later reported restored. Fixes:
  1. Put a **Cloudflare Worker proxy on your own domain** in front of Supabase (free tier: 100k requests/day), and set `NEXT_PUBLIC_SUPABASE_URL` to that domain. Members never touch `supabase.co` directly.
  2. Or use Supabase's **Custom Domain add-on ($10/month, ≈ ₹900)**, which needs a paid plan.
  3. A quick personal workaround is DNS 1.1.1.1 or a VPN. That's fine for you, but it isn't realistic for gym members.
- **Built-in auth emails have a very low hourly limit.** Plug in a free SMTP provider (Brevo, Resend and similar have free tiers) before launch.

### Option B: Supabase Pro

| Item | Cost |
|---|---|
| Pro plan ($25/mo, includes $10 compute credit that covers the smallest instance) | ≈ ₹2,250 + GST/forex ≈ **₹2,300–2,750/month** |
| Optional custom domain add-on (fixes the India-block risk) | +$10 ≈ ₹900/month |
| Domain | ₹900–1,500/yr |
| **Total** | **≈ ₹28,000–45,000 per year** |

**Upsides:** no pausing, daily backups, email support.

**Downsides:** this is overkill for one gym. You pay roughly 25× Option A for features that the free tier plus the backup workflow mostly cover. Upgrade only if the gym grows or adds branches.

### Option C: Firebase (Google)

| Item | Cost |
|---|---|
| Spark (free): 50k reads/day, 20k writes/day, 1 GiB Firestore, 50k MAU auth | ₹0 |
| Hosting | ₹0 |
| Photo uploads: **since Feb 2026, Cloud Storage needs the Blaze (pay-as-you-go) plan** | ≈ ₹0–100/month at this scale |

**Upsides:** runs on Google's infrastructure, which is widely reachable in India. Very generous free quotas.

**Downsides:** Firestore is NoSQL, so reports such as "revenue by month" or "dues per member" are harder to build. Blaze has **no hard spending cap**, only alerts. Server code (Cloud Functions, needed for a payment gateway) requires Blaze. The demo's data layer is isolated in `src/lib/store.ts`, so a Firebase version is doable but would be a rewrite of that layer and the security rules.

### Option D: Your own VPS (PocketBase, or self-hosted Supabase/Appwrite)

| Item | Cost |
|---|---|
| Hostinger KVM 1 (1 vCPU / 4 GB): ₹599/mo promo on a 24-month term, renews ≈ ₹999/mo | ₹7,200–12,000 / yr |
| Domain | ₹900–1,500 / yr |
| **Total** | **≈ ₹8,000–13,500 per year** *(plus your time)* |

**Upsides:** no vendor pausing or blocking, and full control. PocketBase is a single file and very light. Coolify gives one-click deploys.

**Downsides:** you become the ops team. That means OS updates, security patches, backups, SSL and uptime, and if the server dies at 6 AM the gym can't check people in. Self-hosted Supabase is heavy for a 4 GB box.

### Option E: Ready-made gym software (benchmark for "fair price")

| Product | Listed price |
|---|---|
| MyGymDesk (India) | from ₹829/month (annual billing) |
| Gymate | from ₹1,999 |
| FitnessForce | from ₹1,500/month in India; a branded member app is a paid add-on (listed at $99/mo on global sites) |
| Gymdesk (US) | $75–200/month |
| Typical small Indian gym | ₹1,000–5,000/month per vendor guides |

**Upsides:** zero development, plus vendor support.

**Downsides:** ₹10,000–24,000+ per year **and no custom portfolio website**. Member apps are often generic or cost extra. Your data sits in their system.

### Option F: Offline desktop app (trainer's computer only)

An installable Windows app that holds **only the trainer dashboard**: members, renewals, payments, attendance, workout and diet templates. It stores everything in a local SQLite database file on the trainer's PC and needs no internet. The same dashboard screens from this project can be wrapped with **Tauri** (small installer, uses the Windows WebView) or **Electron** (bundles its own browser, much larger installer).

| Item | Cost |
|---|---|
| Hosting / database | ₹0 (runs on the trainer's PC) |
| Code-signing certificate (optional, removes the "Unknown publisher" warning) | ≈ $219/year (≈ ₹20,000) for an entry-level OV certificate; can be skipped for a single PC |
| Backup drive or Google Drive folder for the database file | ₹0–1,500 one-time |
| **Total** | **≈ ₹0 per year** (or ≈ ₹20k/yr if you sign the installer) |

**Upsides:** works with no internet at all, no monthly bills, no vendor pausing or India ISP blocks, and the data never leaves the gym. It's fast on old PCs too, especially with Tauri.

**Downsides:**
- **No member app, no website enquiries, and no access from the trainer's phone.** Those need a server on the internet. Members can't log in to see their workout or diet.
- **One computer only.** If the PC dies or is stolen and there's no backup, all records are gone. Backups become the trainer's job.
- Updates are installed by hand, with a new installer for each version.
- Without a signed installer, Windows SmartScreen shows a warning the first time.

**Hybrid option:** the desktop app works offline and syncs to Supabase when the internet is available, so the member app and website keep working. This is the most capable setup and also the most complex to build (Large effort: conflict handling, sync queue).

**When it fits:** the trainer only wants a digital register at the front desk, and doesn't care about a member app or website leads.

### Summary

| Option | ~Yearly cost | Effort for you | Reliability | Recommended for |
|---|---|---|---|---|
| A. Supabase Free + Netlify Free | **₹900–1,500** | Low | Good, with proxy + backup | **Start here** |
| B. Supabase Pro | ₹28k–45k | Low | Very good | Multi-branch / bigger gym |
| C. Firebase | ₹0–1,200 | Medium (rewrite data layer) | Very good | If Supabase keeps failing in India |
| D. VPS + PocketBase | ₹8k–13.5k | **High (ongoing)** | Depends on you | Only if you enjoy ops |
| E. Off-the-shelf software | ₹10k–24k+ | None | Good | If nobody can maintain custom code |
| F. Offline desktop app | ₹0 (≈ ₹20k/yr if code-signed) | Low running, Medium build | Good, only if backed up | Front-desk register only, no member app or website |

### Being fair to your friend

- Pass infrastructure through **at cost** and show him the actual bills (domain receipt, any Supabase invoice).
- Keep any charge for your work (build fee or yearly maintenance) **separate** from infrastructure, so he can see both.
- A defensible yardstick: if your total yearly charge (infra + maintenance) stays **at or below what off-the-shelf software would cost him (₹10k–24k/yr)**, he gets a custom website and a member app on top. That's clearly a good deal for him.

---

## 4. Add-ons that would make it better

| Feature | Upside | Downside / cost | Works with |
|---|---|---|---|
| **UPI QR on member portal** (show trainer's QR, member pays, trainer confirms) | Free, no KYC, nearly everyone in India has UPI. Already half-built (UPI ID appears in reminders and the portal) | Trainer still confirms payments manually | All options |
| **Payment gateway** (Razorpay; also compare Cashfree, PhonePe PG) | Members pay online and memberships auto-renew on a webhook. Card/EMI support | Cards/netbanking ≈ **2% + 18% GST on the fee ≈ 2.36%**. UPI is currently ~0% MDR (rules may change, so check). Subscriptions/UPI AutoPay add-on reported at ~0.9–1%. Needs KYC (PAN, bank, business proof), handling refunds/chargebacks, and **a small server function for webhooks** | Supabase (Edge Functions, free tier), Firebase (Cloud Functions, **needs Blaze**), VPS |
| *Example:* 100 members × ₹1,500 | | All by card ≈ ₹3,540/month in fees. All UPI ≈ ₹0 | |
| **Automatic WhatsApp reminders** (Meta WhatsApp Cloud API) | No tapping: expiry/dues reminders go out daily on their own | Utility template ≈ **₹0.115/message + GST** (300 msgs ≈ ₹35/month). Provider/BSP platform fees extra if you use one. Needs a verified business number and approved templates | Supabase (Edge Function + `pg_cron`), Firebase (Blaze), VPS |
| **Email reminders** | Cheap, and free tiers exist | Lower open rate than WhatsApp in India | All |
| **Phone OTP login** | Members don't need email or password | Per-SMS cost + mandatory **DLT registration** in India. WhatsApp OTP is an alternative | Supabase/Firebase (SMS provider needed) |
| **QR self check-in** (QR poster at the gym, member scans in app) | Saves trainer time, gives accurate attendance | Needs a "member can insert own attendance" rule plus basic anti-cheat (one per day) | All |
| **Progress photos** | Strong motivation and great testimonial material | Storage: Supabase Free 1 GB is fine. Firebase needs Blaze. Privacy consent required | All |
| **Installable app (PWA) + push notifications** | Looks like a real app on the phone, with no Play Store fee | iOS push needs the app added to the home screen | All (front-end only) |
| **Class / PT slot booking** | Fewer WhatsApp back-and-forths | More UI work. No-show handling | All |
| **GST invoices / PDF receipts** | Professional, and needed if the gym is GST-registered | Invoice numbering rules | All |
| **SEO + Google Business Profile** | Biggest source of "natural audience" for a local gym. GBP is free | Content work (photos, posts, reviews). The Next.js version already server-renders the home page and adds local-business structured data | All |
| **Instagram feed / reels on website** | Social proof, fresh content | Embeds slow down the page | All |
| **Multiple trainers / staff roles** | Scales to a team | More permission rules | All (extra `role` values) |

**Suggested order:** (1) launch the demo on Supabase Free with backup + proxy, (2) UPI QR, (3) Google Business Profile + reviews, (4) PWA, (5) automatic WhatsApp reminders, and (6) a payment gateway only if members ask for card payments.

---

## Sources

- Cloudinary credits and free plan: [Cloudinary billing docs](https://cloudinary.com/documentation/billing_and_plans), [Activepieces Cloudinary pricing 2026](https://www.activepieces.com/blog/cloudinary-pricing-2026-plans-credits-and-costs), [signed uploads](https://cloudinary.com/documentation/authentication_signatures)
- Supabase 1,000-row response limit (why backups page through data): [Supabase fetch docs](https://supabase.co/docs/library/get), [PostgREST pagination](https://docs.postgrest.org/en/v12/references/api/pagination_count.html)

- Desktop app frameworks: [Tauri vs Electron installer sizes (DoltHub)](https://dolthub.com/blog/2025-11-13-electron-vs-tauri), [Tauri 2 overview](https://www.noqta.tn/en/blog/tauri-2-desktop-apps-rust-web-technologies-2026)
- Windows code signing prices: [SSL Insights guide](https://sslinsights.com/best-code-signing-certificate-for-windows-application/), [Microsoft code signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options)
- Next.js PWA support: [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps)

- Supabase pricing & free-tier limits: [supabase.com/pricing](https://supabase.com/pricing), [custom domain billing](https://supabase.com/docs/guides/platform/manage-your-usage/custom-domains), [jetadmin review](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/), [automationatlas](https://automationatlas.io/answers/supabase-free-tier-limits-2026/)
- Supabase blocked in India: [TechCrunch](https://www.techcrunch.com/2026/02/27/india-disrupts-access-to-popular-developer-platform-supabase-with-blocking-order/), [Analytics India Mag (restored)](https://analyticsindiamag.com/ai-news/india-restores-access-to-supabase-after-isp-level-block), [dev.to: proxy fix](https://dev.to/amit_verma_metefy/fix-supabase-down-on-jio-and-jiofiber-by-hiding-supabase-behind-your-own-domain-free-tier-a15)
- Firebase: [firebase.google.com/pricing](https://firebase.google.com/pricing), [Activepieces guide](https://www.activepieces.com/blog/firebase-pricing-2026-plans-costs-and-free-limits.md)
- Appwrite (pauses idle free projects; deletes after 90 days): [changelog](https://appwrite.io/changelog/entry/2026-06-29)
- Vercel Hobby is non-commercial: [vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby)
- Netlify free plan & credits: [netli.fyi](https://netli.fyi/blog/netlify-pricing-and-limits), [Hostfleet comparison](https://hostfleet.pages.dev/cf-pages-vs-vercel-vs-netlify-2026/)
- Next.js on Cloudflare (OpenNext): [opennext.js.org/cloudflare](https://opennext.js.org/cloudflare)
- Cloudflare Pages limits: [developers.cloudflare.com/pages/platform/limits](https://developers.cloudflare.com/pages/platform/limits)
- Hostinger VPS India: [hostinger.com/in/vps-hosting](https://hostinger.com/in/vps-hosting), [renewal pricing](https://hostadvice.com/hosting-company/hostinger-reviews/hostinger-india-pricing/)
- Domains: [Hostinger domain prices India](https://zoutons.com/news/hostinger-domain-price-india-2026)
- Razorpay: [pricing explained (Razorpay blog)](https://razorpay.com/blog/razorpay-payment-gateway-pricing-explained/), [razorpay.com/pricing](https://razorpay.com/pricing)
- WhatsApp Business API India rates: [telecrm](https://telecrm.in/blog/whatsapp-business-api-pricing/), [AiSensy Oct 2026 update](https://m.aisensy.com/blog/whatsapp-pricing-update-october-2026/)
- Gym software prices: [Techjockey MyGymDesk](https://www.techjockey.com/detail/mygymdesk), [Gymate](https://www.techjockey.com/detail/gymate-gym-software), [FitnessForce (Capterra)](https://www.capterra.co.uk/software/128172/fitnessforce), [Easy Gym Software India pricing](https://easygymsoftware.com/blog/gym-software-pricing-in-india), [Gymdesk cost](https://gymdesk.com/blog/gym-management-software-cost)
