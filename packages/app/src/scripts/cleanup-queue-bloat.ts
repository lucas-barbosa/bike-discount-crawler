import { logger } from '@crawlers/base';
import { Queue } from 'bullmq';
import { queueConnection } from '@crawlers/base/dist/queue/client';

/**
 * Drain waiting/delayed jobs and clean completed/failed jobs from bloated queues.
 *
 * Usage: npx tsx src/scripts/cleanup-queue-bloat.ts [--queues=a,b,c] [--dry-run] [--skip-drain] [--skip-clean]
 *
 * Defaults to all *.product_stock and *.old_product_stock queues.
 */

const DEFAULT_QUEUE_NAMES = [
  'tradeinn.product_stock',
  'barrabes.product_stock',
  'bike_discount.product_stock',
  'bike_discount.old_product_stock'
];

interface Options {
  queues: string[]
  dryRun: boolean
  skipDrain: boolean
  skipClean: boolean
}

const parseArgs = (): Options => {
  const args = process.argv.slice(2);
  let queues = DEFAULT_QUEUE_NAMES;
  let dryRun = false;
  let skipDrain = false;
  let skipClean = false;

  for (const arg of args) {
    if (arg.startsWith('--queues=')) {
      queues = arg.split('=')[1].split(',').map(q => q.trim()).filter(Boolean);
    }
    if (arg === '--dry-run') dryRun = true;
    if (arg === '--skip-drain') skipDrain = true;
    if (arg === '--skip-clean') skipClean = true;
  }

  return { queues, dryRun, skipDrain, skipClean };
};

const cleanup = async () => {
  const { queues, dryRun, skipDrain, skipClean } = parseArgs();

  logger.info({ queues, dryRun, skipDrain, skipClean }, 'Starting queue bloat cleanup');

  const summary: Array<{ queue: string, waiting: number, delayed: number, completed: number, failed: number, drained: boolean, cleaned: { completed: number, failed: number } }> = [];

  for (const queueName of queues) {
    const queue = new Queue(queueName, { connection: queueConnection.connection });

    try {
      const [waiting, delayed, completed, failed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getDelayedCount(),
        queue.getCompletedCount(),
        queue.getFailedCount()
      ]);

      logger.info({ queueName, waiting, delayed, completed, failed }, 'Current queue state');

      let drained = false;
      let cleanedCompleted = 0;
      let cleanedFailed = 0;

      if (!dryRun && !skipDrain && (waiting + delayed > 0)) {
        // drain(true) removes both waiting and delayed jobs
        await queue.drain(true);
        drained = true;
        logger.info({ queueName, removed: waiting + delayed }, 'Drained waiting+delayed');
      }

      if (!dryRun && !skipClean) {
        if (completed > 0) {
          const removed = await queue.clean(0, 1_000_000, 'completed');
          cleanedCompleted = removed.length;
          logger.info({ queueName, cleanedCompleted }, 'Cleaned completed');
        }
        if (failed > 0) {
          const removed = await queue.clean(0, 1_000_000, 'failed');
          cleanedFailed = removed.length;
          logger.info({ queueName, cleanedFailed }, 'Cleaned failed');
        }
      }

      summary.push({
        queue: queueName,
        waiting,
        delayed,
        completed,
        failed,
        drained,
        cleaned: { completed: cleanedCompleted, failed: cleanedFailed }
      });
    } catch (err) {
      logger.error({ err, queueName }, 'Error processing queue');
    } finally {
      await queue.close();
    }
  }

  logger.info({ summary, dryRun }, 'Cleanup summary');
  process.exit(0);
};

cleanup().catch(err => {
  logger.fatal({ err }, 'Fatal error in cleanup script');
  process.exit(1);
});
