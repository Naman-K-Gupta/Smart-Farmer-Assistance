# Smart Farmer Assistance & Farm Management System

Smart Farmer is a responsive agricultural operations app for farmers, procurement-centre officers, and government administrators. It brings slot booking, centre capacity, crop intake, procurement progress, and payment visibility into one low-bandwidth-friendly workspace.

## What is included

- Farmer workspace with overview, upcoming procurement, centre capacity, notifications, payments, booking history, booking detail, and profile editing.
- Smart slot booking flow with crop, quantity, centre, and time selection.
- Live procurement-centre cards with queue, capacity remaining, wait estimate, contact details, and available slots.
- Booking status lifecycle: pending, confirmed, approaching, completed, and cancelled.
- Officer workspace with live queue actions and capacity/attention metrics.
- Administration workspace with farmer, centre, booking, payment, trend, and crop-mix metrics.
- Masked payment-account display and clearly labelled demo payment records.
- Responsive mobile navigation and loading, empty, retry, and error states.
- Generated TypeScript API client and Zod contracts from OpenAPI.

## Stack

- React, TypeScript, Vite, Tailwind CSS, Wouter, TanStack Query, Lucide icons
- Express 5 and TypeScript
- PostgreSQL with Drizzle ORM
- OpenAPI + Orval-generated React Query hooks and Zod validators

## Repository layout

```text
artifacts/smart-farmer/       React application
artifacts/api-server/        Express API
lib/api-spec/openapi.yaml    API source of truth
lib/api-client-react/        Generated client hooks
lib/api-zod/                 Generated server validators
lib/db/src/schema/           Drizzle schema
```

## Running locally

The project uses the workspace workflows, which provide the required `PORT` and `BASE_PATH` values.

```bash
pnpm install
pnpm --filter @workspace/api-spec run codegen
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/smart-farmer run dev
```

The web app is served at the root preview path. API requests are routed under `/api`.

## Environment

The built-in development database provides `DATABASE_URL`. The API also expects the workflow-provided `PORT`. No third-party credentials are needed for the demo build.

## Demo workspaces

The landing page provides three clearly labelled demo workspaces:

- **Farmer** — Harpreet Singh, Ludhiana
- **Procurement officer** — Amandeep Kaur, Phagwara
- **Government admin** — Meera Sharma, Chandigarh

Demo sign-in calls `POST /api/auth/demo-login` and returns a short-lived demo token for the selected workspace. This is intentionally not a production identity system. For a production launch, replace this route with Clerk-managed authentication and role claims, then bind API authorization to the authenticated user.

## API overview

- `POST /api/auth/demo-login`
- `GET /api/dashboard`
- `GET/PATCH /api/profile`
- `GET /api/centres`
- `GET /api/centres/:centreId/slots`
- `GET/POST /api/bookings`
- `GET/PATCH/DELETE /api/bookings/:bookingId`
- `GET /api/payments`
- `GET /api/notifications`
- `PATCH /api/notifications/:notificationId/read`
- `GET /api/officer/dashboard`
- `GET /api/admin/dashboard`

The OpenAPI document is the source of truth. After changing it, run:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Database

The Drizzle schema lives in `lib/db/src/schema/smartFarmer.ts`. The API seeds a small, realistic demo dataset on the first request when the Smart Farmer tables are empty. Booking creation decrements slot capacity inside a database transaction and rejects full or duplicate slots. Cancellation returns capacity to the slot.

## External integrations

The demo intentionally uses no live SMS, WhatsApp, map, or banking credentials:

- SMS/WhatsApp: notification records are persisted locally; a provider adapter can be added behind the notification route.
- Maps: centre cards expose latitude/longitude and are ready for Google Maps or OpenStreetMap rendering.
- Payments: records are marked demo and no funds are moved. A bank/payment provider should own any real transaction flow.

## Checks

```bash
pnpm run typecheck
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/smart-farmer run build
```