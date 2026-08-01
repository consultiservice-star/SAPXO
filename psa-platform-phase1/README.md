# PSA Platform — Phase 1 (Foundation)

Multi-tenant project-estimation / time-tracking / accounting / client-portal
platform. This is **Phase 1**: the data model, authentication, multi-tenant
isolation, and role-based access control. It is the backbone everything else
(estimates, time entries, invoices, client portal UI) plugs into.

## What's built so far

- Multi-tenant Postgres schema (Prisma) covering: tenants, users/roles,
  clients, projects, tasks, estimates, change requests, time entries,
  invoices, expenses.
- Auth (NextAuth, credentials-based) — login requires **company slug + email
  + password**, because emails are only unique *within* a tenant, not
  globally.
- Tenant isolation + RBAC guard (`src/lib/access.ts`) — every server
  route must call `requireSession()` / `requireRole()` to get the tenantId
  from the session, never from client input.
- Role-aware dashboard shell (nav changes based on TENANT_ADMIN /
  PROJECT_MANAGER / TEAM_USER / CLIENT).
- Money stored as integer minor units per currency (no floats) — see
  `src/lib/money.ts`.
- Seed script with one demo login per role.

## What's NOT built yet (next phases)

- Project estimation UI (create/send/approve estimates)
- Time entry UI (log time, approve, turn into invoice lines)
- Invoice generation + simple P&L report
- Client portal screens (project status, change-request approval, invoice view)
- Actual translated UI strings (i18n scaffolding is a placeholder — `en`/`fr`
  locale is tracked per user/tenant, but pages aren't wired to a translation
  library yet)
- Signup / tenant-provisioning flow (right now tenants are created via seed
  script or directly in the DB — there's no public "sign up your company" page)
- Billing for YOU to charge your own tenants (Stripe subscriptions) —
  worth deciding early since it changes the data model slightly

## Local setup

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and NEXTAUTH_SECRET
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Then visit `http://localhost:3000/login` and sign in with:

| Company slug | Email | Password | Role |
|---|---|---|---|
| demo-agency | admin@demo.com | Password123! | Tenant Admin |
| demo-agency | pm@demo.com | Password123! | Project Manager |
| demo-agency | team@demo.com | Password123! | Team User |
| demo-agency | client@acme.com | Password123! | Client (portal — not built yet, will 404 for now) |

**Change these demo passwords before going anywhere near real data.**

## Deploying (Railway — recommended)

1. Push this code to a GitHub repo.
2. On [railway.app](https://railway.app), create a new project → "Deploy from
   GitHub repo" → select your repo.
3. Add a **PostgreSQL** plugin to the project (Railway → New → Database →
   PostgreSQL). It auto-generates `DATABASE_URL`.
4. In your app service's variables, add:
   - `DATABASE_URL` → reference the Postgres plugin's variable (Railway lets
     you link them directly)
   - `NEXTAUTH_SECRET` → generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` → your Railway-provided domain (e.g.
     `https://your-app.up.railway.app`)
5. Set the build command to `npm run build` and start command to `npm run
   start` (Railway usually auto-detects Next.js).
6. After first deploy, run migrations against production once:
   ```bash
   railway run npx prisma migrate deploy
   railway run npx prisma db seed   # optional — only for a demo tenant
   ```
7. Done — Railway keeps it running and gives you HTTPS automatically.

Render works almost identically (Web Service + managed Postgres, same env
vars).

## A note on security before you resell this

This phase gives you a correct *foundation* for tenant isolation, but before
this touches real customer data or payments, get a second set of eyes
(a developer or a security-focused code review) on:

- The tenant-isolation guard (`src/lib/access.ts`) and that every single
  route/action actually uses it
- Password reset / account recovery (not built yet)
- Rate limiting on the login route (not built yet — currently vulnerable to
  brute-force attempts)
- HTTPS enforcement and cookie settings in production

None of this is unusual for a v1 — just flagging it so it doesn't get
skipped before you have paying tenants' data in here.
