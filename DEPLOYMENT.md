# Deployment Guide — Barbería Jeranbuq

Production runbook for deploying the barbería booking app to Vercel + Neon.

---

## 1. Prerequisites

- **Node.js** 22+ (project `engines` field requires `>=22.17.1`)
- **pnpm** 9+ (`packageManager: pnpm@9.15.0`)
- **Docker** — only needed for local development (optional, not required for production)

Install pnpm if you don't have it:

```bash
npm install -g pnpm
```

---

## 2. Local Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/barberia-jeranbuq.git
cd barberia-jeranbuq

# Install all workspace dependencies
pnpm install

# Set up local environment variables
cp apps/web/.env.local.example apps/web/.env.local
# Edit .env.local and fill in your values (see sections below)

# Start the dev server
pnpm dev
```

The web app runs at `http://localhost:3000`.

---

## 3. Neon Database Setup

1. Go to [neon.tech](https://neon.tech) and create a new project.
2. In your Neon project dashboard, go to **Connection Details**.
3. Copy the **pooled connection string** — this is your `DATABASE_URL`.
   - It looks like: `postgresql://user:pass@ep-xxx.pooler.us-east-1.aws.neon.tech/neondb?sslmode=require`
4. Copy the **direct (non-pooled) connection string** — this is your `DIRECT_URL`.
   - It looks like: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - Note: the direct URL does NOT include `.pooler` in the hostname.

> **Why two URLs?** Neon uses PgBouncer for connection pooling (`DATABASE_URL`). Prisma migrations require a direct connection that bypasses PgBouncer (`DIRECT_URL`). Both are required.

Set in your environment:

```env
DATABASE_URL=postgresql://... (pooled)
DIRECT_URL=postgresql://...   (direct, no pooler)
```

---

## 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Click **Create Credentials** → **OAuth 2.0 Client ID**.
3. Application type: **Web application**.
4. Under **Authorized redirect URIs**, add:
   ```
   https://yourdomain.com/api/auth/callback/google
   ```
   For local dev also add: `http://localhost:3000/api/auth/callback/google`
5. Save. Copy the **Client ID** (`AUTH_GOOGLE_ID`) and **Client Secret** (`AUTH_GOOGLE_SECRET`).

### Switch to Production mode

Before real users can sign in, the OAuth app must be in **Production** (not Testing) mode:

- [ ] Go to **OAuth consent screen** in Google Cloud Console
- [ ] Add your app logo
- [ ] Add your privacy policy URL
- [ ] Verify your domain ownership
- [ ] Click **Publish App** to switch from Testing to Production

> In Testing mode, only whitelisted Google accounts can sign in. Production mode removes this restriction.

---

## 5. Vercel Deployment

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**.
2. Select the `barberia-jeranbuq` repository.
3. Set the **Root Directory** to `apps/web` (or configure it via `vercel.json` if already present).
4. Under **Environment Variables**, add all variables from `apps/web/.env.local.example`:

   | Variable | Where to find it |
   |---|---|
   | `DATABASE_URL` | Neon pooled connection string |
   | `DIRECT_URL` | Neon direct connection string |
   | `AUTH_SECRET` | Run `openssl rand -base64 32` locally |
   | `AUTH_URL` | Your Vercel deployment URL (e.g. `https://barberia.vercel.app`) |
   | `AUTH_TRUST_HOST` | Set to `true` |
   | `AUTH_GOOGLE_ID` | From Google Cloud Console |
   | `AUTH_GOOGLE_SECRET` | From Google Cloud Console |
   | `RESEND_API_KEY` | From [resend.com](https://resend.com) dashboard |
   | `RESEND_FROM_EMAIL` | Your verified sender in Resend |
   | `ADMIN_NOTIFICATION_EMAIL` | Barber's email address |
   | `CRON_SECRET` | Any random string (used to authenticate cron requests) |
   | `SENTRY_DSN` | From Sentry project settings (server-side) |
   | `NEXT_PUBLIC_SENTRY_DSN` | Same value as `SENTRY_DSN` |
   | `SENTRY_AUTH_TOKEN` | From Sentry → Settings → Auth Tokens (for source maps) |

5. Click **Deploy**.

---

## 6. First-Time Database Migration

After the first deploy, run migrations against the production database:

```bash
# From the repo root — targets the database package
pnpm --filter @barberia-jeranbuq/database db:migrate
```

Or using the root alias:

```bash
pnpm db:migrate
```

> Make sure `DATABASE_URL` and `DIRECT_URL` in your local `.env` point to the production Neon database when running this command, or use Vercel's environment variable export if available.

---

## 7. First-Time Seed

After migration, seed the database with initial services and availability slots:

```bash
pnpm --filter @barberia-jeranbuq/database db:seed
```

This creates:
- The initial service catalog (haircut types, prices, durations)
- Default weekly availability configuration for the barber

> Re-running the seed on an already-seeded database is safe — the seed script is idempotent.

---

## 8. Admin User Creation

The barber (admin) account is created via the `/login/barbero` route. This is not a traditional sign-up — the barber authenticates with a secret code that promotes their Google account to the `ADMIN` role.

**Steps:**

1. Navigate to `https://yourdomain.com/login/barbero`.
2. Enter the barber access code (set during barbershop onboarding — not stored in env vars).
3. Click **Continuar** — this sets an `x-auth-intent=ADMIN` cookie.
4. Sign in with the admin Google account.
5. On first sign-in, the account is automatically promoted to `ADMIN` role in the database.
6. Verify by navigating to `https://yourdomain.com/admin/agenda` — the admin dashboard should be accessible.

> The `x-auth-intent=ADMIN` cookie signals to the auth callback that this sign-in should elevate the account. Without navigating through `/login/barbero` first, a Google sign-in creates a regular `CLIENT` account.

---

## 9. Vercel Cron Verification

The app uses a Vercel Cron Job to handle scheduled tasks (e.g., sending appointment reminders).

**Verify it is registered:**

1. In your Vercel project dashboard, go to **Settings** → **Cron Jobs**.
2. Confirm the cron job appears in the list.
3. Check that it runs on the expected schedule (hourly).
4. Confirm recent executions show status `200`.

> If the cron does not appear, check that `vercel.json` includes the `crons` configuration and redeploy.

---

## 10. Sentry Verification

After deploying, verify that Sentry is receiving errors:

1. In your Sentry project dashboard, go to **Issues**.
2. Optionally trigger a test error by visiting a route that throws intentionally (you can temporarily add `throw new Error("Sentry test")` to a Server Component and revert after confirming).
3. Confirm the error appears in Sentry within a few seconds with stack trace and request context.
4. Remove any test error code before announcing beta launch.

> The `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` must be set in Vercel env vars. Sentry is disabled in `development` mode — it only captures errors in `production`.

---

## 11. Beta Launch Checklist

Complete all items before inviting beta users:

- [ ] Google OAuth app switched to **Production** mode (not Testing)
- [ ] All 14 env vars set in Vercel (verify in Settings → Environment Variables)
- [ ] Database migrated (`pnpm db:migrate` completed with no errors)
- [ ] Database seeded (`pnpm db:seed` — services and availability exist)
- [ ] Admin user created and verified (can access `/admin/agenda`)
- [ ] Test booking end-to-end as a client (select service → pick date → pick slot → confirm)
- [ ] Test appointment management as admin (view agenda, mark appointment as attended)
- [ ] Cron registered in Vercel dashboard (Settings → Cron Jobs shows the job)
- [ ] Sentry receiving errors (trigger a test error and confirm it appears in dashboard)
- [ ] E2E tests run manually: `pnpm test:e2e` (all tests pass)
