import { Queue, type Job } from 'bullmq';
import { queueConnection } from '@crawlers/base/dist/queue/client';

/**
 * Clean up jobs stuck in "active" state for too long.
 * These are jobs that started processing but never completed.
 *
 * Usage: npx tsx src/scripts/cleanup-stuck-jobs.ts [--threshold-minutes=30] [--dry-run]
 */

// All queue names in the system
const ALL_QUEUE_NAMES = [
  // App queues
  'crawlers.main.product_stock',
  'crawlers.main.old_product_stock',
  'crawlers.main.categories',
  'crawlers.main.product_image',
  'crawlers.main.attributes',
  'crawlers.stock_scheduler',
  'crawlers.category_scheduler',
  // Bike Discount queues
  'bike_discount.categories',
  'bike_discount.category',
  'bike_discount.product',
  'bike_discount.product_stock',
  'bike_discount.old_product_stock',
  'bike_discount.translation',
  // Barrabes queues
  'barrabes.categories',
  'barrabes.category',
  'barrabes.product',
  'barrabes.product_stock',
  'barrabes.translation',
  // Tradeinn queues
  'tradeinn.categories',
  'tradeinn.category',
  'tradeinn.product',
  'tradeinn.product_stock',
  'tradeinn.translation',
  'tradeinn.product_image'
];

interface CleanupOptions {
  thresholdMinutes: number
  dryRun: boolean
}

const parseArgs = (): CleanupOptions => {
  const args = process.argv.slice(2);
  let thresholdMinutes = 30; // default 30 minutes
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith('--threshold-minutes=')) {
      thresholdMinutes = parseInt(arg.split('=')[1], 10);
    }
    if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  return { thresholdMinutes, dryRun };
};

const cleanupStuckJobs = async () => {
  const { thresholdMinutes, dryRun } = parseArgs();
  const thresholdMs = thresholdMinutes * 60 * 1000;
  const now = Date.now();

  console.log('========================================');
  console.log('STUCK JOBS CLEANUP');
  console.log('========================================');
  console.log(`Threshold: ${thresholdMinutes} minutes`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');

  let totalStuck = 0;
  let totalCleaned = 0;

  for (const queueName of ALL_QUEUE_NAMES) {
    const queue = new Queue(queueName, {
      connection: queueConnection.connection
    });

    try {
      // Get active jobs
      const activeJobs = await queue.getJobs(['active']);

      if (activeJobs.length === 0) {
        await queue.close();
        continue;
      }

      const stuckJobs: Job[] = [];

      for (const job of activeJobs) {
        if (!job) continue;

        // Check how long the job has been active
        const processedOn = job.processedOn ?? job.timestamp;
        const activeTime = now - processedOn;

        if (activeTime > thresholdMs) {
          stuckJobs.push(job);
        }
      }

      if (stuckJobs.length > 0) {
        console.log(`[${queueName}]`);
        console.log(`  Active jobs: ${activeJobs.length}`);
        console.log(`  Stuck jobs (>${thresholdMinutes}min): ${stuckJobs.length}`);

        totalStuck += stuckJobs.length;

        for (const job of stuckJobs) {
          const processedOn = job.processedOn ?? job.timestamp;
          const activeMinutes = Math.round((now - processedOn) / 60000);

          console.log(`    - Job ${job.id} (active for ${activeMinutes} min)`);

          if (!dryRun) {
            try {
              // Remove the job directly since stuck jobs lose their lock
              // This is more reliable than moveToFailed which requires the lock
              await job.remove();
              totalCleaned++;
              console.log('    ✅ Removed');
            } catch (err: any) {
              // If remove fails because of lock, try to force unlock and remove again
              if (err.message && err.message.includes('locked')) {
                try {
                  const client = await queue.client;
                  const lockKey = `${queue.opts.prefix || 'bull'}:${queueName}:${job.id}:lock`;
                  await client.del(lockKey);
                  console.log(`    🔓 Force unlocked (key: ${lockKey})`);

                  // Try remove again
                  await job.remove();
                  totalCleaned++;
                  console.log('    ✅ Removed (after unlock)');
                } catch (unlockErr: any) {
                  console.error(`    ❌ Failed to force unlock/remove job ${job.id}: ${unlockErr.message}`);
                }
              } else {
                // If remove fails for other reasons, try to retry the job
                try {
                  await job.retry();
                  totalCleaned++;
                  console.log('    ✅ Retried');
                } catch {
                  console.error(`    ❌ Failed to clean job ${job.id}: ${err.message}`);
                }
              }
            }
          }
        }
        console.log('');
      }

      await queue.close();
    } catch (err: any) {
      console.error(`Error processing ${queueName}: ${err.message}`);
    }
  }

  console.log('========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total stuck jobs found: ${totalStuck}`);
  if (dryRun) {
    console.log('Dry run - no jobs were cleaned');
  } else {
    console.log(`Total jobs cleaned: ${totalCleaned}`);
  }
  console.log('');

  process.exit(0);
};

cleanupStuckJobs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
