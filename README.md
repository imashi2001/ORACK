# ORACK

Minimal black-and-white streetwear store for a small Sri Lankan clothing brand.
Customers order without an online payment gateway: the order is saved on the site, then confirmed with the business over WhatsApp.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · React Hook Form · Zod · Prisma 7 · Neon PostgreSQL · Cloudflare R2 · Vercel

## Getting started

You need a PostgreSQL database. The easiest is a free Neon project, with a separate **dev branch** for local work.

```bash
npm install                  # also runs `prisma generate`
cp .env.example .env         # set DATABASE_URL and DIRECT_URL
npm run db:migrate           # create the tables
npm run db:seed              # categories, 8 sample products, default settings

# create your admin login (PowerShell: set the variables with $env:ADMIN_EMAIL="..." first)
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' ADMIN_NAME='Your Name' npm run admin:create

npm run dev                  # store: http://localhost:3000 · admin: http://localhost:3000/admin
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build / serve (the build reads the database) |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:migrate` | Create + apply a migration in development |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Seed sample data (safe to re-run) |
| `npm run db:studio` | Browse the database |
| `npm run admin:create` | Create an admin, or reset an admin's password |
| `npm run vercel-build` | Build command for Vercel: generate → migrate deploy → build |
| `npm test` | Unit + integration tests (Vitest) |
| `npm run test:unit` | Unit tests only, no database needed |
| `npm run test:integration` | Integration tests against `TEST_DATABASE_URL` |
| `npm run test:e2e` | Browser tests (Playwright) against `E2E_DATABASE_URL`: resets it, seeds, builds, runs |

## Project structure

```
prisma/
  schema.prisma               Database schema
  migrations/                 SQL migrations (commit these)
  seed.ts                     Sample catalogue + default settings
scripts/create-admin.ts       Creates admin users (no sign-up page by design)
src/
  proxy.ts                    Redirects signed-out visitors away from /admin (convenience only)
  app/
    (shop)/                   Storefront: home, products, product detail, customize
    admin/login/              Admin sign-in
    admin/(panel)/            Dashboard, orders, products, categories, settings
  features/
    auth/                     Password hashing, DB sessions, login throttling, requireAdmin()
    admin/                    Admin UI, queries and Server Actions per area
    products/                 Cached catalogue queries + storefront product UI
    cart/                     Cart store (localStorage) + checkout drawer
    orders/                   Checkout validation, transactional order service, placeOrder action
    customization/            Custom request form, request service, private image uploads
    settings/                 Business settings (cached for the storefront)
    home/                     Landing page sections
  lib/                        Prisma client, R2 storage, WhatsApp links, formatting, references
```

## How it works

**Ordering.** The browser sends only variant IDs and quantities. `features/orders/order-service.ts` loads prices from the database and, in one transaction, decrements stock with a conditional update (`stock >= qty`) and creates the order. If two customers race for the last item, exactly one succeeds. Each checkout carries an idempotency key, so a double submit returns the first order. New orders are `PENDING` / `UNPAID`. Opening WhatsApp doesn't confirm anything; an admin does that.

**Admin.** Admins are created with `npm run admin:create`. Passwords use Argon2id. Sessions are random tokens in an httpOnly cookie, and only their SHA-256 hash is stored. Login is throttled per email (5 failures / 15 min) and per IP (20), and accounts lock for 30 min after 10 consecutive failures. Every page and Server Action re-checks the session (`requireAdmin` / `authorizeAction`). Roles: **OWNER / ADMIN** manage everything; **STAFF** can manage orders only. Changes are written to `AdminActivityLog`.

**Orders admin.** Search and filter by status, payment and date. Order detail lets you change status (with history and notes), payment status, delivery fee (recalculates the total) and internal notes, and message the customer on WhatsApp. Cancelling returns items to stock, and a cancelled order is final.

**Caching.** Storefront catalogue and settings reads use `"use cache"` with tags. Admin changes and new orders call `updateTag`, so the store updates immediately.

**Custom requests.** A custom request is a quote request, never an order. The customer's form saves a `CustomizationRequest` (status *New request*) and gets presigned PUT URLs for each reference image. The browser uploads straight to the **private** R2 bucket, then the server checks each file arrived (size and type) before marking it uploaded. Missing images don't lose the request; the customer is told to send them on WhatsApp. The random key from the browser is also the customer's proof of ownership when confirming uploads. In the admin (**Custom requests**), images are shown only through 5-minute signed links. The workflow is: prepare a quotation (versions; the total is calculated on the server) → open it in WhatsApp and **Mark as sent** → record **Customer accepted / declined** → **Convert to order**. Converting creates a *Confirmed* order linked to the request, with the custom item and setup fee as separate lines and the delivery fee from the quote. The request is kept, can't be converted twice, and stock isn't changed for custom prints.

**Product photos.** Uploaded straight from the browser to the public R2 bucket using presigned PUT URLs; the server verifies the object before saving it. Without R2 configured, products show the vector placeholder artwork.

## Testing

| Layer | Tool | What it covers |
| --- | --- | --- |
| Unit (`tests/unit`) | Vitest | Prices/phones/WhatsApp links, references, cart rules, sorting, every validation schema (incl. "prices from the browser are dropped", SVG uploads refused) |
| Integration (`tests/integration`) | Vitest + real Postgres | Order transaction: DB prices, snapshots, stock decrement, rollback, duplicate submits, **8 customers racing for the last item**, deleted products; custom requests; rate limiter (incl. concurrency); login throttling |
| End-to-end (`tests/e2e`) | Playwright (Chromium, desktop + Pixel 7) | Browse, filter, sold-out sizes, checkout validation, place order → WhatsApp hand-off; custom request; admin login/logout, confirm order + payment, quote → convert to order, product edits show in store, new products get a working page; security headers, cross-site Server Action refused; **axe WCAG 2.1 AA** scans; mobile menu, no sideways scroll, full-width bag |

Test databases must have **"test" in their name** (the suites refuse to run otherwise, because they empty every table). Locally, create two throwaway databases (e.g. Neon branches or a local Postgres):

```bash
TEST_DATABASE_URL=postgresql://…/orack_test npm run test:integration
E2E_DATABASE_URL=postgresql://…/orack_e2e_test npm run test:e2e     # E2E_REUSE=1 re-runs without rebuilding
npx playwright install chromium                                      # first time only
```

CI (`.github/workflows/ci.yml`) runs lint, types and unit tests, then integration and e2e tests against a Postgres service, on every push and pull request.

> Windows note: `npm test` goes through `scripts/vitest.mjs`, which fixes a Vitest problem with lower-case drive letters (`c:\…`).

## Security

**In place**
- **Validation:** Zod on every Server Action; the server never trusts prices or stock from the browser.
- **Database:** Prisma parameterises all queries; the single raw query (rate limiter) uses tagged templates.
- **Admin auth:** Argon2id passwords, DB sessions (httpOnly, SameSite=Lax, Secure cookie; only a hash of the token is stored), login throttling and account lockout, role checks in every page *and* action, audit log.
- **CSRF:** Next.js Server Actions reject cross-origin requests (Origin check; tested).
- **Rate limits:** placing orders (10 / 10 min per IP) and custom requests (5 / 10 min), stored as hashed keys in Postgres.
- **Uploads:** type and size checked before signing; size and type are part of the presigned URL; the server verifies each object after upload; random object keys; customer images live in a private bucket and are only viewable through 5-minute signed links.
- **Headers:** Content-Security-Policy, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy; `X-Powered-By` removed.
- **XSS:** React escaping everywhere; no `dangerouslySetInnerHTML`; social links must be `https://`.
- **Errors:** friendly error pages; server errors logged as JSON lines (`onRequestError`); required env vars checked at startup.

**Trade-offs / later**
- The CSP allows inline scripts (`'unsafe-inline'`). A nonce-based CSP would make every page dynamic and is incompatible with Partial Prerendering. Revisit if requirements change.
- Rate limits key on the client IP from `x-forwarded-for` (trustworthy on Vercel). Add Vercel Firewall / BotID rules if abuse appears.
- `npm audit` reports issues in the **Prisma CLI's** config loader (`effect`). It's a build-time tool, not reachable at runtime; recheck when upgrading Prisma.
- Consider 2FA for admins and an uptime/error alerting service once live.

## Deploying (summary)

1. Neon: create the project (Singapore region is a good start; test latency from Sri Lanka) and copy the pooled and direct connection strings.
2. Vercel: import the GitHub repo, set **Build Command** to `npm run vercel-build`, and add the env vars from `.env.example` for Production and Preview. Use a separate Neon branch for Preview.
3. R2: create the `orack-public` bucket (public access / custom domain) and `orack-private` bucket (**no** public access). Create an API token scoped to those buckets. On **both** buckets, add a CORS rule allowing `PUT` (and `GET` on the private bucket for the admin image preview) from your site's domain(s) with the `Content-Type` header.
4. Run `npm run admin:create` once against production (`DIRECT_URL` set to the production database).

## Status

- [x] **Phase 1 — Setup:** Next.js, TypeScript, Tailwind, shadcn/ui, Prisma 7, folder structure, schema
- [x] **Phase 2 — Public website:** home, listing (filter / search / sort), product detail, customize page, cart, responsive UI
- [x] **Phase 3 — Admin:** auth, dashboard, products / variants / stock / photos, categories, business settings
- [x] **Phase 4 — Orders:** transactional orders with stock control, admin order management, WhatsApp hand-off
- [x] **Phase 5 — Customization:** saved requests, private R2 uploads, admin review, versioned quotations, convert to order
- [x] **Phase 6 — Testing & security:** unit / integration / E2E + accessibility tests, CI, CSP & security headers, rate limiting, error handling
- [ ] **Phase 7 — Deployment:** Neon production DB, Vercel, R2, domain
