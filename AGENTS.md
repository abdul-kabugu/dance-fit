# Repository Guidelines

## Project Structure & Module Organization
DanceFit uses Next.js App Router (`app/`). Feature folders contain routes, server actions, and UI for that surface. API handlers (`app/api/**/route.ts`) should only depend on helpers under `lib/` such as `auth.ts`, `api-helpers.ts`, `upload.ts`, and `validators.ts`. Shared components stay in `components/`, hooks in `hooks/`, Prisma schema + seeds in `prisma/`, and asset layers in `public/` + `styles/`. Keep smart-contract helpers in `contracts/` and co-locate feature-specific assets near their route for easier ownership.

## Build, Test, and Development Commands
- `pnpm dev` → local Next.js dev server with hot reload.
- `pnpm build && pnpm start` → production build + serve.
- `pnpm lint` (after migrating to `eslint.config`) and `pnpm format:check` → formatting + ESLint gates.
- `pnpm generate`, `pnpm push`, `pnpm seed` → Prisma client regen, schema sync, and seed data.
- `pnpm db:reset` → drop, migrate, reseed for a clean DB.

## Coding Style & Naming Conventions
Use TypeScript across the stack, 2-space indentation, and Prettier with the Tailwind + sort-import plugins. Prefer server components; include `'use client'` only when stateful UI, Clerk hooks, or browser APIs are required. Components use PascalCase, hooks camelCase prefixed with `use`, and helpers are verb-first (`format-currency.ts`, `use-bch-session.ts`). Tailwind is the styling baseline—compose conditionals with `cn()` and respect the design spacing scale.

## Testing Guidelines
Validate every request payload with zod (`lib/validators.ts`) and wrap multi-step writes in Prisma transactions. When touching checkout math, BCH payments, or dashboard analytics, add unit coverage plus integration smoke tests for `/api/events`, `/api/checkout/sessions`, `/api/payments/sessions`, and `/api/dashboard/overview`. Keep deterministic fixtures in `prisma/seed.ts` so SSR dashboards remain stable.

## Commit & Pull Request Guidelines
Commits stay focused and use imperative tense (`feat: add BCH webhook`). In the body, mention affected `/api/*` routes or Prisma models. PRs must include a summary, test evidence (`pnpm dev`, `pnpm generate`, etc.), screenshots for UI-impacting changes, and callouts for deferred work (e.g., fiat path TBD). Keep lint-only sweeps separate to avoid hiding logic.

## Security & Configuration Tips
Update `.env.example` whenever new Clerk, Prisma, or Blob env vars are introduced—never hardcode secrets. Blob uploads must go through `/api/uploads` so tokens remain server-side. Server components that fetch APIs (dashboard SSR, event detail) should build URLs with `process.env.NEXT_PUBLIC_APP_URL` to keep local, staging, and prod behavior aligned.
