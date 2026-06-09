# barberia-jeranbuq

Appointment booking system for a barbershop — built with Next.js 15, Turborepo, and PostgreSQL.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 22.17.1 (see `.nvmrc`) |
| pnpm | 9.x |
| Docker Desktop | Latest |

## Getting Started

```bash
# 1. Clone the repository
git clone <repo-url>
cd barberia-jeranbuq

# 2. Use the correct Node version
nvm use

# 3. Install dependencies
pnpm install

# 4. Start the database
docker compose up -d

# 5. Copy environment variables
cp apps/web/.env.local.example apps/web/.env.local
# Edit apps/web/.env.local and fill in the required values

# 6. Run database migrations
pnpm --filter @barberia-jeranbuq/database db:migrate

# 7. Generate Prisma client
pnpm --filter @barberia-jeranbuq/database db:generate

# 8. Start the development server
pnpm dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
barberia-jeranbuq/
├── apps/
│   └── web/                    # Next.js 15 application
│       └── src/
│           ├── app/            # App Router pages and layouts
│           ├── backend/        # Server-side logic (auth, db access)
│           └── frontend/       # Client-side components and utilities
├── packages/
│   ├── database/               # Prisma schema, client singleton
│   ├── shared/                 # Shared types, schemas, constants (Zod)
│   ├── typescript-config/      # Shared tsconfig presets
│   └── eslint-config/          # Shared ESLint flat config presets
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── docker-compose.yml          # Local PostgreSQL 16
├── turbo.json                  # Turborepo pipeline
└── pnpm-workspace.yaml         # pnpm workspaces config
```

## Available Scripts

Run from the repository root via Turborepo:

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all apps and packages |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:migrate` | Run pending Prisma migrations |
| `pnpm db:push` | Push schema changes without migrations |
| `pnpm db:studio` | Open Prisma Studio (run via filter: `pnpm --filter @barberia-jeranbuq/database db:studio`) |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Auth | Auth.js v5 (NextAuth) |
| ORM | Prisma 6 |
| Database | PostgreSQL 16 |
| Monorepo | Turborepo + pnpm workspaces |
| Validation | Zod 3 |
| CI | GitHub Actions |

## License

MIT
