# Delivery Management App

A mobile-first app to define delivery zones on a map, assign products to zones, and accept orders only when the customer's location is inside a zone that delivers that product.

| | |
|---|---|
| **Live (HTTPS)** | https://delivery-app-three-psi.vercel.app |
| **Source code** | https://github.com/scorpionTaj/delivery-app |
| **Test account** | `test@demo.com` / `Test1234!` (or sign up with any email: no confirmation needed) |
| **Project started** | 22 October 2026, 16:08 |
| **Project finished** | 22 October 2026, 17:04 |
| **CI** | GitHub Actions: lint, typecheck, unit tests, build |

The live database already contains example data: 15 zones in Casablanca, 18 products and about 160 orders.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions), **React 19.3**, **Node 24 LTS**
- **HeroUI v3** components + **Tailwind CSS 4**, light/dark/system theme
- **Supabase** – Auth (email/password) and Postgres
- **Leaflet / react-leaflet** + OpenStreetMap tiles (open source, no API key)
- **Vercel** hosting

## Features

- **Authentication** – sign up, log in, log out. Every page except `/login` is protected by `proxy.ts` (Next 16's middleware).
- **Zones** – tap the map to set a center, give it a name and a radius in meters. All zones are drawn as circles on an interactive map. The list sorts by radius (largest or smallest first) or by name.
- **Products** – name, price, stock and the zones that deliver it. Products can be edited, restocked, deleted (refused if they already have orders), searched, and sorted by stock (most first, or out of stock first), price or name. Stock chips turn amber or red at the low-stock threshold.
- **Orders** – pick a product and quantity, then tap the customer's location. The server:
  1. loads the zones assigned to that product,
  2. computes the haversine distance to each center and keeps the zones that contain the point,
  3. picks one of those zones by the configured rule (nearest center by default),
  4. otherwise rejects the order with a clear message, e.g. *"Location is 2.3 km outside the nearest zone that delivers Water 1.5L"*,
  5. checks the stock and decrements it.

  Accepted orders are listed with their assigned zone and the price at the time of ordering. They can be filtered by zone (with a map) and sorted by date, total or quantity.
- **Dashboard** – totals and revenue, a low-stock alert, a map of zones and order locations, and per-zone counts of orders, units, revenue and assigned products. Each zone keeps the same color on every page.
- **Settings** – workspace rules enforced on the server: currency (MAD / USD / EUR), low-stock threshold, max quantity per order, zone selection rule (nearest center or smallest zone) and edge tolerance in meters.
- **UI** – mobile-first: a bottom tab bar on phones and a sidebar on desktop that can collapse to icons only. Light, dark and system themes. The theme and the sidebar state are applied before the page is drawn, so neither flashes.

## Architecture

```
proxy.ts                       session refresh + auth guard
app/login/                     login/sign-up form + server actions
app/(app)/layout.tsx           sidebar (desktop) / bottom nav (mobile)
app/(app)/zones|products|orders|dashboard|settings
lib/geo.ts                     haversine, findZone, zone colors
lib/validation.ts              pure input parsing for every server action
lib/sort.ts                    list sorting (zones, products, orders)
lib/useFormAction.ts           form hook that keeps input on validation errors
components/ZoneMap.tsx         Leaflet map (loaded with next/dynamic, ssr: false)
supabase/schema.sql            tables, RLS, indexes, place_order() + zone_order_stats()
supabase/seed.sql              example zones, products and ~150 orders (re-runnable)
tests/                         unit tests (node --test): geo, validation, sorting, formatting
.github/workflows/ci.yml       lint → typecheck → tests → build on every push/PR
```

- **The zone check runs on the server** (`app/(app)/orders/actions.ts`). The browser only sends the clicked point.
- **Stock is decremented atomically** in the Postgres function `place_order()`. A conditional `UPDATE … WHERE quantity >= n` runs in the same transaction as the insert, so two simultaneous orders can't oversell. The function also re-checks that the product is assigned to the chosen zone.
- **RLS** is enabled on every table: any logged-in user can read and write (one shared team workspace), and anonymous requests get nothing.
- **Dashboard totals** come from `zone_order_stats()` in SQL, so they stay correct beyond the API's 1,000-row page limit.

## Run locally

Requires Node 24+ and a Supabase project.

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon/publishable key
npm run dev                  # http://localhost:3000
```

Database setup, in the Supabase SQL Editor:

1. Run `supabase/schema.sql` to create the tables, policies, indexes and functions.
2. Optionally run `supabase/seed.sql` to add the example data.
3. In **Authentication → Sign In / Providers → Email**, turn off "Confirm email" so new accounts are logged in straight away.

## Tests

All unit tests live in `tests/` and use Node's built-in test runner (no extra dependency):

```bash
npm test          # unit tests
npm run check     # lint + typecheck + tests, the same steps CI runs
```

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, the unit tests and a production build on every push to `master` and on every pull request.

## Deploy (Vercel)

1. Import the GitHub repo in Vercel. It detects Next.js; no build settings are needed.
2. In **Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (your project's anon/publishable key). No secret key is used: database access is protected by RLS.
3. Deploy. Every push to `master` redeploys automatically.

Every page is rendered on the server, so refreshing or opening a deep link such as `/orders` works directly, and logged-out visitors are redirected to `/login`.

## AI tools used

I used **Claude Code** (Anthropic) as a pair programmer, to scaffold the project, write UI components, and set up Supabase, Vercel and CI through their connectors. I designed the schema, the zone and stock logic and the validation rules, and I reviewed and tested every change, in the browser and with unit tests. Problems caught and fixed during review:

- React 19 resets a form after every action, which wiped the user's input on validation errors. I added `useFormAction`, which resets only on success.
- Hashing zone ids to pick colors gave two zones the same color. Colors are now assigned by creation order.
- Order timestamps caused a hydration mismatch because Node and the browser disagree on Morocco's time-zone rules. Dates are now formatted once, on the server.
- Checking stock and then updating it in app code could race. It now runs as one conditional `UPDATE` inside a database function.
- Dashboard totals summed rows in JavaScript, and would have stopped counting silently past 1,000 orders. They are now aggregated in SQL.
- CI failed on a clean checkout because Next's generated route types (`LayoutProps`) didn't exist yet. `npm run typecheck` now runs `next typegen` first.

## What I'd do next

PostGIS (`ST_DWithin`) for zone queries at scale, roles (admin and driver), order status and editing, pagination, polygon zones.
