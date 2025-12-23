import { Queue } from 'bullmq';
import { queueConnection } from '@crawlers/base/dist/queue/client';
import { logger } from '@crawlers/base';

/**
 * Clean up all repeatable jobs from stock queues
 * This removes the old recurring jobs (200k individual jobs)
 */
const cleanupRepeatableJobs = async () => {
  const queueNames = [
    'barrabes.product_stock',
    'bike_discount.product_stock',
    'bike_discount.old_product_stock',
    'tradeinn.product_stock'
  ];

  logger.info('Starting cleanup of repeatable jobs...');

  for (const queueName of queueNames) {
    logger.info({ queueName }, 'Processing queue');

    const queue = new Queue(queueName, {
      connection: queueConnection.connection
    });

    try {
      // Get all repeatable jobs
      const repeatableJobs = await queue.getRepeatableJobs();
      logger.info({ count: repeatableJobs.length }, 'Found repeatable jobs');

      // Remove each repeatable job
      let removed = 0;
      for (const job of repeatableJobs) {
        try {
          await queue.removeRepeatableByKey(job.key);
          removed++;

          // Log progress every 100 jobs
          if (removed % 100 === 0) {
            logger.info({ removed, total: repeatableJobs.length }, 'Progress...');
          }
        } catch (err) {
          logger.error({ err, key: job.key }, 'Failed to remove job');
        }
      }

      logger.info({ removed, queueName }, 'Removed repeatable jobs');

      await queue.close();
    } catch (err) {
      logger.error({ err, queueName }, 'Error processing queue');
    }
  }

  logger.info('Cleanup complete!');
  process.exit(0);
};

cleanupRepeatableJobs().catch(err => {
  logger.fatal({ err }, 'Fatal error');
  process.exit(1);
});
