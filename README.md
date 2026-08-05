# deutschania

A real, database-backed rebuild of the original `deutschania-store-v6.html` prototype: a bilingual/trilingual (Arabic/German/English, RTL/LTR) e-commerce storefront for German products sold into the Arab world. Built with Next.js 16 (App Router), PostgreSQL via Prisma 7, NextAuth credentials login, and PayTabs for payment.

The original single-file prototype is kept for reference in [`legacy/deutschania-store-v6.html`](legacy/deutschania-store-v6.html).

## Tech stack

- **Next.js 16** (App Router, TypeScript, no Turbopack)
- **PostgreSQL** via **Prisma 7** (new `prisma-client` generator + `@prisma/adapter-pg`)
- **NextAuth v5** (Credentials provider, JWT sessions) for email/password login
- **PayTabs** Hosted Payment Page for real checkout
- **Zod** for input validation, **bcrypt** for password hashing
- **Playwright** (dev dependency) for browser-driven verification during development

## Prerequisites

- Node.js 20+ and npm
- A PostgreSQL database. For local development, the easiest path is Prisma's own local dev server (no separate Postgres install needed) — see below.

## Setup

```bash
npm install
```

### 1. Database

**Local dev (recommended for trying this out):**

```bash
npx prisma dev
```

This starts a local Postgres instance in the background and prints a `DATABASE_URL`. Leave it running in its own terminal (or use `-d` to detach it), then paste that URL into `.env`.

**Real Postgres (production or a hosted dev DB):** create a database with any provider (Supabase, Neon, Railway, RDS, etc.) and use its connection string instead.

Copy the example env file and fill in `DATABASE_URL`:

```bash
cp .env.example .env
```

### 2. Push the schema and seed data

```bash
npx prisma db push
npm run db:seed
```

This creates all tables and seeds the 7 categories and ~29 products extracted from the original prototype.

### 3. Auth secret

`.env.example` has a placeholder `AUTH_SECRET`. Generate a real one:

```bash
node -e "console.log(require('crypto').randomBytes(33).toString('base64'))"
```

### 4. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See [`.env.example`](.env.example) for the full list. Summary:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | NextAuth JWT signing secret |
| `NEXTAUTH_URL` | Base URL of the app (`http://localhost:3000` in dev) |
| `PAYTABS_PROFILE_ID`, `PAYTABS_SERVER_KEY` | From your PayTabs dashboard → Developers → Key Management |
| `PAYTABS_REGION` | One of `SAU`, `ARE`, `EGY`, `OMN`, `JOR`, `KWT`, `IRQ`, `MAR`, `QAT`, `GLOBAL` — determines which regional PayTabs endpoint is used (see `src/lib/paytabs.ts`) |

Without PayTabs credentials, checkout will create the order in the database (status `PENDING`) but fail to redirect to a payment page — the error is surfaced on the checkout form rather than silently pretending payment succeeded.

## Promoting a user to admin

There's no signup flow for admins. After registering a normal account, open Prisma Studio and flip the role by hand:

```bash
npm run db:studio
```

Open the `users` table, find your row, change `role` from `CUSTOMER` to `ADMIN`, save. You can now visit `/admin/products`.

## Useful scripts

```bash
npm run dev          # start the dev server
npm run build         # production build
npm run lint          # eslint
npm run db:push       # push prisma/schema.prisma to the database (no migration files)
npm run db:seed       # re-run prisma/seed.ts (safe to re-run - upserts by slug/key)
npm run db:studio     # Prisma Studio, a GUI for browsing/editing the database
```

## Project structure

```
prisma/
  schema.prisma      # Product, Category, User, Address, CartItem, WishlistItem, Order, OrderItem
  seed.ts            # loads categories/products/subcategories/attributes from the original prototype
src/
  app/
    page.tsx                    # home (reads ?cat=/?q=/?wish= search params)
    product/[slug]/page.tsx     # product detail
    login/, register/           # auth pages (register is a 3-step wizard)
    cart/, checkout/, checkout/return/
    admin/products/             # admin-only product editor (role check via NextAuth session)
    api/                        # route handlers: auth, register, cart, wishlist, checkout,
                                 # paytabs webhook, orders, products/compare, admin/products
  components/                   # Header, SideMenu, ShopSection, ProductCard, CartDrawer,
                                 # WishlistProvider/WishButton, CompareProvider/CompareModal, Hero, ...
  i18n/                         # ar.json / de.json / en.json + config.ts
  lib/                          # db.ts (Prisma client), auth.ts, cart.ts, currency.ts, paytabs.ts
  data/subcategories.ts         # subcategory mega-menu data (ar/de/en)
```

## What's real vs. what's still a demo

Real and backend-verified:
- Product catalog, categories and subcategories all come from Postgres, not hardcoded JS.
- Login/registration with hashed passwords (bcrypt) and real sessions (NextAuth).
- Cart persists server-side, for both logged-in users (by `userId`) and guests (by a signed cookie session id).
- Wishlist persists server-side per logged-in user (guests are prompted to log in — there's no guest wishlist).
- Compare is intentionally client-side only (localStorage, up to 4 products), since it's an ephemeral browsing aid rather than account data.
- Checkout creates a real `Order`/`OrderItem` row and hands off to PayTabs' Hosted Payment Page; the webhook (`/api/paytabs/webhook`) marks the order `PAID`/`FAILED` from PayTabs' server-to-server callback.
- Admin panel lets an `ADMIN`-role user edit product price/brand for real, replacing the original prototype's in-page pencil-icon editing (which only ever wrote to that one browser's local storage).

Still simplified relative to a full production build:
- No order history page for customers, no email notifications on order status changes.
- Product images are placeholder SVG icons unless `Product.imageUrl` is set directly in the database — there's no image upload UI yet.
- The admin panel only edits price/brand; there's no product create/delete UI, and descriptions/attributes/images must be edited via Prisma Studio.
- No automated tests beyond manual Playwright smoke checks run during development.
