# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (runs all packages via Turborepo)
```bash
yarn build       # Build all packages
yarn lint        # Lint all packages
```

### Per-package development
```bash
# Run dev server for a specific package (from its directory)
yarn dev         # e.g., in packages/app or packages/barrabes

# Run a specific crawler via CLI (after building)
yarn crawler:bb  # barrabes (from packages/app)
yarn crawler:bd  # bike-discount (from packages/app)
yarn crawler:tt  # tradeinn (from packages/app)

# Cleanup scripts (from packages/app)
yarn cleanup:repeatable-jobs
yarn cleanup:stuck-jobs
```

### Building individual packages
```bash
# From a package directory
yarn build       # tsc && tsc-alias
yarn lint        # eslint ./**/*.ts --quiet
yarn lint:fix
```

### Production
```bash
pm2 start ecosystem.config.js   # Runs packages/app/dist/src/index.js
docker-compose up                # Starts Redis + app containers
```

## Architecture

This is a **Yarn workspaces monorepo** orchestrated with **Turborepo**. The system scrapes product data from three stores and delivers it to registered WordPress instances.

### Packages

| Package | Language | Purpose |
|---|---|---|
| `@crawlers/base` | TypeScript | Shared: BullMQ client, Redis, Puppeteer browser pool, logger |
| `@crawlers/barrabes` | TypeScript | Barrabes store crawler |
| `@crawlers/bike-discount` | TypeScript | Bike Discount store crawler |
| `@crawlers/tradeinn` | TypeScript | TradeInn store crawler |
| `@crawlers/app` | TypeScript | Main orchestrator: initializes all crawlers, manages queues, HTTP API |
| `eslint-config-crawlers` | JS | Shared ESLint config (extends standard-with-typescript) |
| `lb-crawlers-receiver` | PHP | WordPress plugin that receives crawler data via REST API |

### Data Flow

1. **Crawlers** (`barrabes`, `bike-discount`, `tradeinn`) scrape product pages using Puppeteer + Cheerio. Each crawler exposes an `initQueue()` that accepts callback functions: `onProductFound`, `onStockFound`, `onCategoriesFound`, `onTranslationFound`, `onProductImageFound`, `onAttributesFound`.

2. **`@crawlers/app`** wires everything together in `src/crawlers/index.ts`: it calls each crawler's `initQueue()` passing its own callback handlers. Callbacks enqueue data into BullMQ queues (product, stock, categories, translation, etc.).

3. **Queue workers** in `packages/app/src/queue/` process jobs and call **publishers** in `src/publishers/` which POST data to all registered **listeners** (WordPress endpoints) via `src/infrastructure/listeners.ts`.

4. **Schedulers** (`scheduler.ts`, `category-scheduler.ts`) run recurring BullMQ jobs to re-check stock for all registered products. Configuration via env vars: `STOCK_SCHEDULER_INTERVAL_DAYS`, `STOCK_SKIP_IF_CHANGED_WITHIN_HOURS`.

5. **`lb-crawlers-receiver`** (PHP/WordPress plugin) exposes REST API endpoints under `src/Apis/` and processes received data into WooCommerce products/categories.

### Key Infrastructure (`@crawlers/base/src/`)

- **`queue/client.ts`**: `createQueue()` and `createWorker()` wrappers around BullMQ. Queue concurrency controlled via `MAX_QUEUE` env var; worker concurrency via `WORKER_CONCURRENCY`.
- **`crawler/browser-manager.ts`**: Puppeteer browser pool (generic-pool) with stealth plugin. Page acquisition uses `PAGE_ACQUIRE_TIMEOUT`.
- **`infrastructure/redis.ts`**: Shared Redis client.

### Path Aliases

Each TypeScript package uses `tsc-alias` to resolve path aliases after compilation. See each package's `tsconfig.json` for `paths` mappings (e.g., `#callbacks/*`, `#queue/*`, `#infrastructure/*` in `packages/app`).

### WordPress Plugin (`lb-crawlers-receiver`)

The PHP plugin lives in `packages/lb-crawlers-receiver/src/`:
- `Apis/` — REST API endpoint handlers (one per data type: Product, Stock, Categories, etc.)
- `Barrabes/`, `BikeDiscount/`, `TradeInn/` — Crawler-specific product/stock handling classes
- `Common/BaseProduct.php` — Abstract base for product processors; handles category mapping and hierarchy logic
- `Common/Categories.php` — Category management utilities
- `Jobs/` — WP background jobs (e.g., category backfill, delete-by-category)
- `Data/` — Data access layer

### Environment Variables

Key env vars (see `@crawlers/base/src/config.ts` and `docker-compose.yml`):
- `QUEUE_HOST`, `QUEUE_PORT`, `QUEUE_PASSWORD` — Redis/BullMQ connection
- `REDIS_URL` — Redis URL for infrastructure layer
- `DIGITAL_OCEAN_BUCKET`, `DIGITAL_OCEAN_ACCESS_KEY`, `DIGITAL_OCEAN_SECRET` — Image storage
- `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET` — Express session auth for Bull Board UI
- `MAX_QUEUE`, `WORKER_CONCURRENCY`, `JOB_LOCK_DURATION` — Queue tuning
- `MAX_PAGE_NUM`, `PAGE_NAVIGATION_TIMEOUT`, `PAGE_ACQUIRE_TIMEOUT` — Crawler tuning
