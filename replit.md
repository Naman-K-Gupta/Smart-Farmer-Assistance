# Smart Farmer Assistance

A responsive agricultural operations workspace for farmers, procurement officers, and administrators to coordinate crop intake, booking slots, centre queues, and payments.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/smart-farmer` — React/Vite application and responsive workspace routes.
- `artifacts/api-server` — Express routes, demo seed initialization, booking capacity logic.
- `lib/api-spec/openapi.yaml` — source of truth for the REST contract.
- `lib/db/src/schema/smartFarmer.ts` — Drizzle tables for Smart Farmer data.
- `README.md` — setup, demo workspaces, API overview, and integration notes.

## Architecture decisions

- OpenAPI is the contract source; the React Query client and server Zod validators are generated from it.
- Booking creation decrements slot capacity in a database transaction and refuses duplicate or full slots.
- Demo workspaces are explicit and isolated from production authentication; production identity should be added through Clerk before launch.
- Payment records are demo-only and never represent a real financial transfer.
- Centre locations are stored with coordinates so a real map provider can be added without changing the domain model.

## Product

Farmers can reserve procurement windows, monitor centre capacity, follow crop and payment status, and update their farm profile. Officers can work a live arrival queue, while administrators can see system-wide participation and procurement trends.

## User preferences

- The user asked for a polished, professional, farmer-friendly product rather than a static UI prototype.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI document.
- Run `pnpm run typecheck:libs` after changing shared database schema exports so API packages see fresh declarations.
- Demo seed data is created lazily on the first Smart Farmer API request when the tables are empty.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
