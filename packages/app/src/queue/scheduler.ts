import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { getProducts, isCrawlerEnabled, getProductMetadata } from '#infrastructure/product-registry';
import { getStockLastChangedTimestamp } from '#infrastructure/stock-cache';
import { enqueueStock as enqueueBarrabesStock } from '@crawlers/barrabes/dist/queue/stock';
import { enqueueStock as enqueueBikeDiscountStock } from '@crawlers/bike-discount/dist/queue/stock';
import { enqueueOldStock as enqueueBikeDiscountOldStock } from '@crawlers/bike-discount/dist/queue/old-stock';
import { enqueueStock as enqueueTradeinnStock } from '@crawlers/tradeinn/dist/queue/stock';

const QUEUE_NAME = 'crawlers.stock_scheduler';

// Configuration from environment variables with defaults
const SCHEDULER_INTERVAL_DAYS = parseInt(process.env.STOCK_SCHEDULER_INTERVAL_DAYS ?? '2', 10);
const SKIP_IF_CHANGED_WITHIN_HOURS = parseInt(process.env.STOCK_SKIP_IF_CHANGED_WITHIN_HOURS ?? '24', 10);

const SCHEDULER_INTERVAL = SCHEDULER_INTERVAL_DAYS * 24 * 60 * 60 * 1000; // Convert days to ms
const SKIP_IF_CHANGED_WITHIN = SKIP_IF_CHANGED_WITHIN_HOURS * 60 * 60 * 1000; // Convert hours to ms

interface SchedulerJobData {
  crawlerId?: string // Optional: if set, only schedule for this crawler
}

interface SchedulerStats {
  crawlerId: string
  type: 'stock' | 'old-stock'
  total: number
  skipped: number
  enqueued: number
}

let queue: Queue;
export const schedulerQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

/**
 * Schedule stock jobs for a specific crawler and type
 */
const scheduleStockJobs = async (
  crawlerId: string,
  type: 'stock' | 'old-stock',
  products: string[]
): Promise<SchedulerStats> => {
  const stats: SchedulerStats = {
    crawlerId,
    type,
    total: products.length,
    skipped: 0,
    enqueued: 0
  };

  const now = Date.now();

  for (const productUrl of products) {
    // Check if stock changed recently
    const lastChanged = await getStockLastChangedTimestamp(productUrl, crawlerId);

    if (lastChanged && (now - lastChanged) < SKIP_IF_CHANGED_WITHIN) {
      stats.skipped++;
      continue;
    }

    // Enqueue to appropriate queue
    try {
      if (type === 'old-stock') {
        // Get metadata for old-stock
        const metadata = await getProductMetadata(crawlerId, type, productUrl);
        if (metadata && crawlerId === 'bike-discount') {
          await enqueueBikeDiscountOldStock(productUrl, metadata?.variations ?? []);
        }
      } else {
        // Regular stock
        if (crawlerId === 'barrabes') {
          const metadata = await getProductMetadata(crawlerId, type, productUrl);
          await enqueueBarrabesStock(productUrl, metadata?.isPro ?? false);
        } else if (crawlerId === 'bike-discount') {
          await enqueueBikeDiscountStock(productUrl);
        } else if (crawlerId === 'tradeinn') {
          await enqueueTradeinnStock(productUrl);
        }
      }
      stats.enqueued++;
    } catch (err) {
      console.error(`Failed to enqueue ${type} for ${crawlerId}:${productUrl}`, err);
    }
  }

  return stats;
};

export const schedulerWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<SchedulerJobData>) => {
    console.log('========================================');
    console.log('STOCK SCHEDULER STARTED', new Date());
    console.log('========================================');

    const allStats: SchedulerStats[] = [];
    const crawlerIds = data.crawlerId ? [data.crawlerId] : ['barrabes', 'bike-discount', 'tradeinn'];

    for (const crawlerId of crawlerIds) {
      // Check if crawler is enabled
      const enabled = await isCrawlerEnabled(crawlerId);
      if (!enabled) {
        console.log(`Skipping ${crawlerId} (disabled)`);
        continue;
      }

      console.log(`\n--- Processing ${crawlerId} ---`);

      // Get products for this crawler
      const stockProducts = await getProducts(crawlerId, 'stock');
      const oldStockProducts = await getProducts(crawlerId, 'old-stock');

      // Schedule regular stock jobs
      if (stockProducts.length > 0) {
        const stats = await scheduleStockJobs(crawlerId, 'stock', stockProducts);
        allStats.push(stats);
        console.log(`Stock: ${stats.enqueued} enqueued, ${stats.skipped} skipped (total: ${stats.total})`);
      }

      // Schedule old-stock jobs
      if (oldStockProducts.length > 0) {
        const stats = await scheduleStockJobs(crawlerId, 'old-stock', oldStockProducts);
        allStats.push(stats);
        console.log(`Old-Stock: ${stats.enqueued} enqueued, ${stats.skipped} skipped (total: ${stats.total})`);
      }
    }

    // Summary
    console.log('\n========================================');
    console.log('SCHEDULER SUMMARY');
    console.log('========================================');
    const totalEnqueued = allStats.reduce((sum, s) => sum + s.enqueued, 0);
    const totalSkipped = allStats.reduce((sum, s) => sum + s.skipped, 0);
    const totalProducts = allStats.reduce((sum, s) => sum + s.total, 0);
    console.log(`Total Products: ${totalProducts}`);
    console.log(`Enqueued: ${totalEnqueued}`);
    console.log(`Skipped (recently changed): ${totalSkipped}`);
    console.log('========================================');
  });

  return worker;
};

/**
 * Initialize the scheduler with recurring job
 */
export const startSchedulerQueue = async () => {
  schedulerQueue();
  schedulerWorker();

  const crawlers = ['barrabes', 'bike-discount', 'tradeinn'];

  await Promise.all(crawlers.map(async crawler => {
    // Add recurring job
    await queue.add(
      'stock-scheduler',
      { crawlerId: crawler },
      {
        repeat: {
          every: SCHEDULER_INTERVAL
        },
        ...removeOptions
      }
    );
  }));

  console.log(`Stock scheduler initialized (runs every ${SCHEDULER_INTERVAL / 1000 / 60 / 60}h)`);
};

/**
 * Manually trigger scheduler for all crawlers or specific crawler
 */
export const triggerScheduler = async (crawlerId?: string) => {
  schedulerQueue();
  await queue.add(
    `stock-scheduler-manual-${Date.now()}`,
    { crawlerId },
    removeOptions
  );
  console.log(`Scheduler triggered${crawlerId ? ` for ${crawlerId}` : ' for all crawlers'}`);
};
