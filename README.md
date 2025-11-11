<div align="center">
	<h1>🧚‍♀️ Freelance Flow</h1>
	<p><strong>Lightweight monthly bill & cash‑flow tracker built for freelancers.</strong></p>
	<p>Focus on what you owe, what you've paid, and what's coming due next — with automatic month generation and unpaid bill carryover.</p>
</div>

## Why Freelance Flow?
Freelancers juggle variable income and a mix of recurring and one‑off expenses. Spreadsheets get messy fast:

Freelance Flow gives you:
* A rolling monthly dashboard of bills (recurring + one‑offs + carryovers)
* Automatic generation of each new month from your active templates
* Seamless carryover of any unpaid one‑off bills into the current month (flagged as carried over)
* Quick inline edits (amount, due date, bank account) and paid toggles
* A 7‑day upcoming amount due summary for short‑term cash planning
* Simple categorization + per‑category color dots for visual grouping

Built with modern, server‑side friendly Next.js 14 + Prisma, no heavy front‑end state libraries.

## Core Concepts
| Concept | Description |
|--------|-------------|
| Category | High‑level grouping (Rent, Utilities, Subscriptions…). Has optional color. |
| Bill Template | Defines a recurring bill (default amount + due day + optional default bank account). Active templates spawn monthly bills. |
| Bill | A concrete payable item for a month. May come from a template (recurring) or be a one‑off. Can be marked paid. |
| Month Key | `YYYY-MM` string used for fast filtering and uniqueness constraints. |
| Carryover | An unpaid one‑off bill from a previous month duplicated into the current month and tagged as `carriedOver`. |

## How Month Generation Works
On first visit (or navigation) to a month (`/` or `/bills/[YYYY-MM]`):
1. Active templates generate that month's recurring bills (unique per template per month).
2. Any unpaid one‑off bills from prior months are carried over (one copy per source per month).
3. Visiting an already generated month will backfill newly added templates and still carry over unpaid one‑offs not yet copied.

Logic lives in `src/server/regenerate.ts` (`ensureMonthGenerated`).

## Data Model (Prisma)
Key tables (see `prisma/schema.prisma`):
* `Category` – name, optional color, relations to templates and bills.
* `BillTemplate` – base definition for a recurring bill (amountDefault, dueDayDefault, bankAccountDefault, isActive).
* `Bill` – actual monthly instance (amountDue, dueDate, isPaid, month, optional templateId, carryover metadata).

Notable constraints:
* `@@unique([month, templateId])` — prevents duplicate recurring bills for a template in a month.
* `@@unique([month, carriedOverFromId])` — prevents multiple carryovers for the same original bill in a single month.

## Screens & Flows
### Dashboard (`/`)
* Overview cards: total due, paid, remaining, 7‑day upcoming.
* Combined bill list: current month bills + any unpaid past bills (sorted with carryovers first).
* Add one‑off bill modal.
* Create recurring template modal.

### Month View (`/bills/[month]`)
* Month navigation (prev / next).
* Totals + percentage paid.
* Inline form to add a one‑off bill scoped to that month.
* Editable bill table.

### Categories (`/categories`)
* Create/update/delete categories with color selection.

## Tech Stack
* **Framework:** Next.js 14 (App Router, Server Components, Server Actions)
* **ORM:** Prisma 6 (PostgreSQL)
* **Styling:** Tailwind CSS + system/Geist fonts
* **Runtime:** Node.js (Edge not required)

## Prerequisites
* Node.js 18+ (LTS recommended)
* PostgreSQL database (local Docker, Neon, Supabase, etc.)
* `DATABASE_URL` environment variable

## Prisma & local database setup
This project uses Prisma as the ORM, with the client generated into `src/generated/prisma` (see `prisma/schema.prisma` and `prisma.config.ts`).

At any time you can peek inside your data visually by launching Prisma Studio: `pnpm prisma:studio` — explore Categories, BillTemplates, and Bills without writing SQL.

### Option A: Local Postgres on macOS (Homebrew)
1) Install and start Postgres
	- brew install postgresql@16
	- brew services start postgresql@16
2) Create a database
	- createdb financefairy
3) Set your `.env` (or copy `.env.example`)
	- DATABASE_URL="postgresql://postgres:postgres@localhost:5432/financefairy" (adjust user/password if needed)
4) Generate client and run migrations
	- pnpm prisma:generate
	- pnpm prisma:migrate
5) (Optional) Seed and open Prisma Studio
	- pnpm db:seed
	- pnpm prisma:studio

### Option B: Local Postgres via Docker
Run a local Postgres 16 container (data will persist while the container exists):
  - docker run --name financefairy-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=financefairy -p 5432:5432 -d postgres:16
Then set `DATABASE_URL` accordingly, generate, migrate, and seed as above.

### Useful Prisma commands
- Generate client after schema changes: pnpm prisma:generate
- Create/apply dev migrations: pnpm prisma:migrate (equivalent to `prisma migrate dev`)
- Apply migrations in production: prisma migrate deploy
- Visual data browser: pnpm prisma:studio

Schema location: `prisma/schema.prisma` (datasource uses `DATABASE_URL`). Generated client output: `src/generated/prisma` as configured in the Prisma `generator` block.

Tips:
- If you change the schema, regenerate the client and re-run migrations.
- Prefer `migrate dev` during development; use `migrate deploy` in CI/prod.
- If you use a serverless Postgres (Neon/Supabase), enable connection pooling.

## Quick Start
Start by cloning the repo: https://github.com/fhayes301/FreelanceFlow.git
```bash
cd freelanceflow
cp .env.example .env        # create and edit DATABASE_URL
pnpm install                # or npm install / yarn
pnpm prisma:migrate         # sets up schema
pnpm db:seed                # optional sample data
pnpm dev                    # start dev server at http://localhost:3000
```

Open the app; the current month will auto‑generate.

### Environment
Create `.env`:
```
DATABASE_URL=postgresql://user:password@host:port/dbname
```

If deploying, also configure any production logging preferences or pooling (e.g. PgBouncer). Prisma client uses a singleton pattern (`src/lib/prisma.ts`).

## Seeding
`pnpm db:seed` runs `prisma/seed.ts` and inserts example categories and templates plus one demo one‑off bill.

## Common Scripts
| Script | Purpose |
|--------|---------|
| `dev` | Run Next.js locally. |
| `build` | Production build. |
| `start` | Start built app. |
| `prisma:migrate` | Apply / create dev migrations. |
| `prisma:generate` | Regenerate Prisma client (after schema changes). |
| `db:seed` | Seed database. |
| `prisma:studio` | Inspect data via Prisma Studio. |

## Bill Table Interactions
Within the table (component: `BillTable.tsx`):
* Toggle paid status.
* Inline edit amount, due date, bank account.
* Delete bill.
* Carried over bills are visually distinguished (e.g., via styling and ordering).

## Adding Features / Contributing
Ideas welcome! Open an issue or PR for:
* Income tracking & projected cash surplus.
* Per‑category monthly summaries.
* Export (CSV / JSON) or simple API endpoints.
* Multi‑currency support.
* Authentication & multi‑tenant (currently single‑user local).

### Development Notes
* Server Actions in `src/server/actions.ts` handle mutations + revalidation.
* Month computations in `src/lib/month.ts` (formatting, navigation, clamping days).
* Generation is idempotent; safe to navigate months freely.
* Decimal precision is handled via Prisma Decimal; cast to Number for display.

## Deployment
Deploy easily to Vercel:
1. Set `DATABASE_URL` in Vercel environment settings.
2. Run migrations (either locally then push, or via `prisma migrate deploy` in a build step).
3. Optional: add `POSTGRES_PRISMA_URL` with Accelerate if using Prisma Accelerate.

### Recommended Build Command
```
pnpm prisma:generate && pnpm build
```

## Security & Auth
Currently no authentication — intended for personal/local use. If you fork for multi‑user:
* Introduce a `User` model and foreign keys (`userId`) on core tables.
* Add auth (NextAuth, custom OAuth, or passwordless) and row‑level filtering.

## License
MIT — see `LICENSE` for full text. Free to use, modify, and distribute.

## Credits
Built with Next.js, Prisma, Tailwind. Fonts: Geist by Vercel. Inspiration: the pain of scrappy spreadsheets and missed freelance due dates.

---
Enjoy smoother months ✨ — contributions and suggestions welcome.
