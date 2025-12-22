# Stock Crawler Scheduler - Operations Guide

This guide covers how to manage the stock crawler scheduler system, including cleanup, scheduling, and triggering operations.

## Table of Contents
- [Overview](#overview)
- [Migration from Old System](#migration-from-old-system)
- [Importing Products](#importing-products)
- [Scheduler Operations](#scheduler-operations)
- [Troubleshooting](#troubleshooting)

---

## Overview

The stock crawler uses a **scheduler-based approach** instead of individual recurring jobs:
- **Before**: 200k individual recurring jobs (one per product) → crashes
- **After**: 1 recurring scheduler job that manages all products → scalable

**Key Components:**
- **Product Registry**: Redis Sets storing product URLs by crawler
- **Stock Scheduler**: Single recurring job (runs every 48h)
- **Smart Filtering**: Skips products with recent stock changes (last 24h)

---

## Migration from Old System

### Step 1: Clean Up Old Recurring Jobs

**Remove all existing recurring jobs** before using the new system:

```bash
cd packages/app
yarn cleanup:repeatable-jobs
```

This script will:
- Find all repeatable jobs in stock queues
- Remove them one by one
- Show progress (logs every 100 jobs)
- Handle all 4 queues: `barrabes.product_stock`, `bike_discount.product_stock`, `bike_discount.old_product_stock`, `tradeinn.product_stock`

**Expected output:**
```
Starting cleanup of repeatable jobs...

Processing queue: barrabes.product_stock
  Found 45000 repeatable jobs
  Removed 100/45000 jobs...
  Removed 200/45000 jobs...
  ...
  ✅ Removed 45000 repeatable jobs from barrabes.product_stock
```

### Step 2: Verify Cleanup

Check BullMQ Board or Redis to confirm no repeatable jobs remain:
```bash
redis-cli
> KEYS bull:*:repeat
# Should return empty or only show the scheduler job
```

---

## Importing Products

After cleanup, import your products to the new Redis-based registry.

### Bike Discount

**Regular Stock (SKU-based):**
```bash
yarn cli bike-discount import --stock products.csv
```

**Old Stock (Product ID-based):**
```bash
yarn cli bike-discount import --oldStock old-products.csv
```

CSV format for old-stock: `productId,url,variationName`

### Barrabes

```bash
yarn cli barrabes import --stock products.csv
```

The CLI automatically detects if products are from the Pro website (`barrabes.com/pro/`) and stores that metadata.

### Tradeinn

```bash
yarn cli tradeinn import --stock products.csv
```

**Expected output:**
```
Import File
Registered 50000 stock products
Finished
```

---

## Scheduler Operations

### Automatic Scheduling

The scheduler runs automatically every **48 hours** and:
1. Fetches all products from Redis registry
2. Checks if each crawler is enabled
3. For each product, checks if stock changed in last **24 hours**
4. Skips recently changed products (saves resources)
5. Enqueues one-time jobs for remaining products
6. Logs detailed statistics

**Logs example:**
```
========================================
STOCK SCHEDULER STARTED 2025-12-22T17:00:00
========================================

--- Processing bike-discount ---
Stock: 45000 enqueued, 5000 skipped (total: 50000)
Old-Stock: 8000 enqueued, 2000 skipped (total: 10000)

--- Processing barrabes ---
Stock: 38000 enqueued, 7000 skipped (total: 45000)

--- Processing tradeinn ---
Stock: 42000 enqueued, 8000 skipped (total: 50000)

========================================
SCHEDULER SUMMARY
========================================
Total Products: 155000
Enqueued: 133000
Skipped (recently changed): 22000
========================================
```

### Manual Triggering

**Trigger for all crawlers:**
```bash
yarn cli scheduler trigger
```

**Trigger for specific crawler:**
```bash
yarn cli scheduler trigger --crawler bike-discount
yarn cli scheduler trigger --crawler barrabes
yarn cli scheduler trigger --crawler tradeinn
```

This is useful for:
- Testing after importing new products
- Re-running after fixing issues
- Forcing a crawl outside the 48h schedule

### Enable/Disable Crawlers

**Disable a crawler** (scheduler will skip it):
```bash
yarn cli scheduler disable bike-discount
```

**Enable a crawler:**
```bash
yarn cli scheduler enable bike-discount
```

**Check status:**
All crawlers are enabled by default. Check Redis:
```bash
redis-cli
> GET scheduler:enabled:bike-discount
# Returns "true" or "false" (or null if not set = enabled)
```

---

## Configuration

Edit [`packages/app/src/queue/scheduler.ts`](file:///Users/lucas-barbosa/Development/Ariel/apps/crawlers/packages/app/src/queue/scheduler.ts) to adjust:

```typescript
// How often scheduler runs
const SCHEDULER_INTERVAL = 48 * 60 * 60 * 1000; // 48 hours

// Skip products if stock changed within this time
const SKIP_IF_CHANGED_WITHIN = 24 * 60 * 60 * 1000; // 24 hours
```

**Recommendations:**
- `SCHEDULER_INTERVAL`: Keep at 48h for most cases
- `SKIP_IF_CHANGED_WITHIN`: Adjust based on your needs
  - Lower (12h) = More frequent crawls for active products
  - Higher (48h) = Skip more products, save resources

---

## Troubleshooting

### Scheduler Not Running

**Check if scheduler job exists:**
```bash
# Via BullMQ Board: Look for "crawlers.stock_scheduler" queue
# Or check Redis:
redis-cli
> KEYS bull:crawlers.stock_scheduler:*
```

**Restart the app** to reinitialize scheduler:
```bash
yarn start
```

### Products Not Being Crawled

1. **Check if products are registered:**
```bash
redis-cli
> SMEMBERS product-registry:bike-discount:stock
# Should return list of URLs
```

2. **Check if crawler is enabled:**
```bash
redis-cli
> GET scheduler:enabled:bike-discount
# Should return "true" or null (null = enabled)
```

3. **Check scheduler logs** for errors or skip reasons

4. **Manually trigger** to test:
```bash
yarn cli scheduler trigger --crawler bike-discount
```

### Too Many Products Skipped

If the scheduler skips too many products:
- Products might have been crawled recently (check stock-cache timestamps)
- Reduce `SKIP_IF_CHANGED_WITHIN` in scheduler.ts
- Or manually trigger to force crawl all products

### Memory Issues

If you still have memory issues:
- Verify old recurring jobs are removed (run cleanup script again)
- Check BullMQ Board for job counts
- Monitor Redis memory usage: `redis-cli INFO memory`

---

## Redis Keys Reference

**Product Registry:**
```
product-registry:barrabes:stock → Set of product URLs
product-registry:bike-discount:stock → Set of product URLs
product-registry:bike-discount:old-stock → Set of product URLs
product-registry:tradeinn:stock → Set of product URLs
```

**Product Metadata:**
```
product-registry-meta:bike-discount:old-stock:{url} → JSON with variations
product-registry-meta:barrabes:stock:{url} → JSON with isPro flag
```

**Scheduler Control:**
```
scheduler:enabled:barrabes → "true" | "false"
scheduler:enabled:bike-discount → "true" | "false"
scheduler:enabled:tradeinn → "true" | "false"
```

**Stock Cache (with timestamps):**
```
stock-cache_{id}_{crawlerId} → JSON stock data
stock-cache_{id}_{crawlerId}-timestamp → Unix timestamp
```

---

## Quick Reference

```bash
# Cleanup old system
yarn cleanup:repeatable-jobs

# Import products
yarn crawler:bd import --stock products.csv
yarn crawler:bb import --stock products.csv
yarn crawler:tt import --stock products.csv

# Manual trigger
yarn cli scheduler trigger
yarn cli scheduler trigger --crawler-id barrabes

# Enable/disable
yarn cli scheduler enable bike-discount
yarn cli scheduler disable bike-discount

# Check status
redis-cli SMEMBERS product-registry:bike-discount:stock
redis-cli GET scheduler:enabled:bike-discount
```
