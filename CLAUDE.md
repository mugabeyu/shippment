# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

La Grande Marque — an internal shipping & logistics admin system (Mauritius ↔ Madagascar freight) built with Next.js (App Router) and Supabase. Staff manage customers, shipments, pricing categories, loyalty offers, expenses, and receipts.

## Commands

```
npm run dev        # start dev server
npm run build       # production build
npm run start        # run production build
npm run lint        # eslint .
npm run typecheck    # tsc --noEmit
```

There is no test suite configured in this repo.

`next.config.ts` sets `typescript.ignoreBuildErrors: true`, so `next build` will succeed even with type errors — run `npm run typecheck` separately to catch them.

## Architecture

**Route groups**: `app/(auth)/` holds `login`, `register`, `reset-password` (no shared chrome — layout is a passthrough). `app/(dashboard)/` holds all authenticated pages and shares `app/(dashboard)/layout.tsx`, which renders the sidebar/topbar, wires up `useSessionTimeout` (30-min inactivity logout with a 5-min warning), and reads the active staff identity from `useUiStore`.

**Auth flow**: `proxy.ts` (Next's newer name for `middleware.ts` — this project is on Next 16, which still supports both) is the gatekeeper for every non-API, non-public route. It reads the Supabase session cookie, confirms the user has a matching row in `staff` with `active = true`, and redirects to `/login` otherwise. API routes (`/api/**`) opt out of this redirect and do their own auth via `lib/auth.ts` (`getSessionUser`) or `lib/audit.ts` (`getActingStaff`) — both re-derive the staff row from the same session cookie independently, since middleware and route handlers use separate Supabase client instances.

**Supabase clients** (`lib/supabase/`):
- `client.ts` — browser client, `createBrowserClient` with cookie-based (not localStorage) sessions, required so `proxy.ts` can read the session server-side.
- `server.ts` — `getServiceSupabase()` uses the service-role key when present (bypasses RLS; required for writes) and falls back to the anon key so reads still work before the service key is configured. `getAdminSupabase()` is for `auth.admin` operations (staff invites) and requires the service key.

**API routes** (`app/api/**/route.ts`): thin REST handlers over Supabase, one directory per resource (`shipments`, `customers`, `staff`, `categories`, `offers`, `expenses`, `shipping-items`, `notifications`, `audit`, `config`, `settings`). Convention per route: instantiate `getServiceSupabase()`, query/mutate, call `logAudit(req, action, details)` on mutations (best-effort, swallows its own errors, never fails the parent request), return `NextResponse.json`. Errors are caught and returned as `{ error: message }` with status 500 rather than thrown.

**Naming boundary**: the database is snake_case; the frontend/store types are camelCase. `lib/mappers.ts` converts DB rows to camelCase shapes (e.g. `mapShipment`) inside API routes. `lib/api.ts`'s `request()` also recursively camelizes any JSON response as a second safety net, so client code should never see snake_case keys.

**Data fetching** (`lib/swr.ts`): all client-side data access goes through SWR hooks (`useShipments`, `useCustomers`, `useStaff`, etc.), each wrapping `lib/api.ts` calls and doing optimistic local mutation (`mutate(..., false)`) after writes rather than refetching. `lib/store.ts` holds the shared TypeScript domain types (`Shipment`, `Customer`, `Staff`, ...) plus a small Zustand `useUiStore` for sidebar/active-staff UI state (persisted to `localStorage`).

**Shipments domain logic** lives in `app/api/shipments/route.ts`: a shipment has one or more line items (priced by weight × quantity × unit price), pricing/discounts come from the single active row in `offers` (either a flat `discount_percent`/`discount_amount`, or cumulative loyalty rewards once a customer crosses `target_kg` in `total_kg_sent`), and `origin`/`destination` are derived from `routeDirection` (`aller` = Madagascar→Mauritius, `retour` = reverse). Creating a shipment updates the customer's `total_kg_sent` and is not wrapped in a DB transaction — the line-items insert is manually rolled back (deletes the shipment) if it fails.

**i18n**: `lib/i18n.ts` is a lightweight EN/FR dictionary (Zustand-backed) keyed by the English source string, so untranslated strings fall back to English automatically — no ICU/pluralization support.

**Migrations**: `supabase/migrations/*.sql`, applied directly against the Supabase project (no local Supabase CLI workflow configured in this repo). Filenames are timestamp-prefixed; check them for current schema rather than assuming table shapes.

**CI**: `.github/workflows/` only runs a scheduled ping job to keep the free-tier Supabase project from pausing — there is no test/lint/build CI gate.
