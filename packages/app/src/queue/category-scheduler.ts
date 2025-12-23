import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { isCategoryCrawlerEnabled } from '#infrastructure/category-registry';
import { enqueueCategory as enqueueBarrabesCategory } from '@crawlers/barrabes/dist/queue/category';
import { enqueueCategory as enqueueBikeDiscountCategory } from '@crawlers/bike-discount/dist/queue/category';
import { enqueueCategory as enqueueTradeinnCategory } from '@crawlers/tradeinn/dist/queue/category';
import { crawlerSettings as barrabesSettings } from '@crawlers/barrabes/dist/infrastructure/crawler-settings';
import { getSelectedCategories as getBikeDiscountCategories } from '@crawlers/bike-discount/dist/infrastructure/crawler-settings';
import { crawlerSettings as tradeinnSettings } from '@crawlers/tradeinn/dist/infrastructure/crawler-settings';
import { logger } from '@crawlers/base';

const QUEUE_NAME = 'crawlers.category_scheduler';

// Configuration from environment variables with defaults
const SCHEDULER_INTERVAL_DAYS = parseInt(process.env.CATEGORY_SCHEDULER_INTERVAL_DAYS ?? '30', 10);
const SCHEDULER_INTERVAL = SCHEDULER_INTERVAL_DAYS * 24 * 60 * 60 * 1000; // Convert days to ms

interface SchedulerJobData {
  crawlerId?: string // Optional: if set, only schedule for this crawler
}

interface SchedulerStats {
  crawlerId: string
  total: number
  enqueued: number
}

let queue: Queue;

export const categorySchedulerQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

/**
 * Get selected categories for a crawler from crawler-settings
 */
const getSelectedCategories = async (crawlerId: string): Promise<string[]> => {
  let categories: string[] | null = null;

  if (crawlerId === 'barrabes') {
    categories = await barrabesSettings.getSelectedCategories();
  } else if (crawlerId === 'bike-discount') {
    categories = await getBikeDiscountCategories();
  } else if (crawlerId === 'tradeinn') {
    categories = await tradeinnSettings.getSelectedCategories();
  }

  return categories ?? [];
};

/**
 * Schedule category crawl jobs for a specific crawler
 */
const scheduleCategoryJobs = async (
  crawlerId: string,
  categories: string[]
): Promise<SchedulerStats> => {
  const stats: SchedulerStats = {
    crawlerId,
    total: categories.length,
    enqueued: 0
  };

  for (const categoryUrl of categories) {
    // Enqueue to appropriate crawler queue
    if (crawlerId === 'barrabes') {
      await enqueueBarrabesCategory({ categoryUrl, page: 1 });
    } else if (crawlerId === 'bike-discount') {
      await enqueueBikeDiscountCategory({ categoryUrl, page: 1 });
    } else if (crawlerId === 'tradeinn') {
      await enqueueTradeinnCategory({ categoryUrl, page: 1 });
    }

    stats.enqueued++;
  }

  return stats;
};

/**
 * Category scheduler worker
 * Runs periodically to schedule category crawl jobs
 */
export const categorySchedulerWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<SchedulerJobData>) => {
    logger.info({ date: new Date() }, 'CATEGORY SCHEDULER STARTED');

    const allStats: SchedulerStats[] = [];
    const crawlerIds = data.crawlerId ? [data.crawlerId] : ['barrabes', 'bike-discount', 'tradeinn'];

    for (const crawlerId of crawlerIds) {
      // Check if crawler is enabled
      const enabled = await isCategoryCrawlerEnabled(crawlerId);
      if (!enabled) {
        logger.info({ crawlerId }, 'Skipping (disabled)');
        continue;
      }

      logger.info({ crawlerId }, '\n--- Processing ---');

      // Get categories from crawler-settings
      const categories = await getSelectedCategories(crawlerId);

      if (categories.length === 0) {
        logger.info({ crawlerId }, 'No categories configured');
        continue;
      }

      // Schedule category jobs
      const stats = await scheduleCategoryJobs(crawlerId, categories);
      allStats.push(stats);
      logger.info({ crawlerId, stats }, 'Categories enqueued');
    }

    // Summary
    const totalCategories = allStats.reduce((sum, s) => sum + s.total, 0);
    const totalEnqueued = allStats.reduce((sum, s) => sum + s.enqueued, 0);
    logger.info({ totalCategories, totalEnqueued, date: new Date() }, 'Summary');
  });

  return worker;
};

/**
 * Start the category scheduler queue with recurring job
 */
export const startCategorySchedulerQueue = async () => {
  categorySchedulerQueue();
  categorySchedulerWorker();

  // Add recurring job (runs every 30 days by default)
  await queue.add(
    'category-scheduler',
    {},
    {
      repeat: {
        every: SCHEDULER_INTERVAL,
        immediately: false // Don't run on startup
      },
      ...removeOptions
    }
  );

  logger.info(`Category scheduler initialized (interval: ${SCHEDULER_INTERVAL_DAYS} days)`);
};

/**
 * Manually trigger the category scheduler
 * @param crawlerId Optional - if provided, only schedule for this crawler
 */
export const triggerCategoryScheduler = async (crawlerId?: string) => {
  categorySchedulerQueue();

  logger.info('Triggering category scheduler...');
  if (crawlerId) {
    logger.info(`Scheduler triggered for ${crawlerId}`);
  }

  await queue.add(
    `category-scheduler-manual-${Date.now()}`,
    { crawlerId },
    removeOptions
  );

  logger.info('Category scheduler job enqueued successfully');
};
