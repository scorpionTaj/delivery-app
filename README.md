# Delivery Management App

Live: LIVE_URL · Test account: `test@demo.com` / `Test1234!`

A mobile-first app to define delivery zones on a map, assign products to zones, and accept orders only when the customer's location is inside a zone that delivers that product.

## Stack

- **Next.js 16** (App Router, TypeScript, Server Actions) + **Tailwind CSS 4**
- **Supabase** – Auth (email/password) and Postgres
- **Leaflet / react-leaflet** + OpenStreetMap tiles (no API key)
- **Vercel** hosting

## Features

- Sign up, log in, log out. Every page except `/login` is protected by `proxy.ts` (Next 16's middleware).
- **Zones** – tap the map to set a center, give it a name and a radius in meters. All zones are drawn as circles.
- **Products** – name, price, stock quantity, and the zones it is available in (editable later).
- **Orders** – pick a product and quantity, tap the customer's location. The server:
  1. loads the zones assigned to that product,
  2. computes the haversine distance to each center and keeps the zones that contain the point,
  3. picks the **nearest** containing zone,
  4. rejects with a clear message otherwise, e.g. *"Location is 2.3 km outside the nearest zone that delivers Water 1.5L"*,
  5. checks and decrements stock.
- **Dashboard** – totals, a map of zones and order locations, and per-zone counts of orders, units and assigned products. Zone colors match on every page.

## Architecture

```
proxy.ts                       session refresh + auth guard
app/login/                     login/sign-up form + server actions
app/(app)/layout.tsx           sidebar (desktop) / bottom nav (mobile)
app/(app)/zones|products|orders|dashboard
lib/geo.ts                     haversine, findZone, zone colors
lib/geo.test.ts                unit tests (node --test)
lib/useFormAction.ts           form hook that keeps input on validation errors
components/ZoneMap.tsx         Leaflet map (loaded with next/dynamic, ssr: false)
supabase/schema.sql            tables, RLS policies, place_order() function
```

- **The zone check is server-side** (`app/(app)/orders/actions.ts`); the browser only sends the clicked point.
- **Stock is decremented atomically** in the Postgres function `place_order()`: a conditional `UPDATE … WHERE quantity >= n` in the same transaction as the insert. Two simultaneous orders can't oversell, and it also re-checks that the product is assigned to the chosen zone.
- **RLS** is enabled on every table: any authenticated user can read and write (one shared team workspace). Anonymous requests get nothing.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + anon/publishable key
npm run dev
npm test                     # haversine / zone-matching tests
```

Database: run `supabase/schema.sql` in the Supabase SQL editor. In **Authentication → Sign In / Providers → Email**, turn off "Confirm email" so sign-up logs straight in.

## Deploy

Import the repo in Vercel and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## AI tools used

I used Claude Code to scaffold and write the UI. I designed the schema and the zone/stock logic, and I reviewed all the code. Bugs fixed during review:

- React 19 resets a form after every action, which wiped the user's input on validation errors. I added `useFormAction`, which resets only on success.
- Hashing zone ids to pick colors gave two zones the same color. Colors are now assigned by creation order.
- Order timestamps caused a hydration mismatch because Node and the browser disagree on Morocco's time-zone rules. Dates are now formatted once, on the server.
- Stock check-then-update in app code could race. It now runs as one conditional `UPDATE` inside a database function.

## What I'd do next

PostGIS (`ST_DWithin`) for zone queries at scale, roles (admin and driver), order status and editing, pagination, polygon zones.
