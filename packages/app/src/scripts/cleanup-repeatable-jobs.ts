import { Queue } from 'bullmq';
import { queueConnection } from '@crawlers/base/dist/queue/client';

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

  console.log('Starting cleanup of repeatable jobs...\n');

  for (const queueName of queueNames) {
    console.log(`Processing queue: ${queueName}`);

    const queue = new Queue(queueName, {
      connection: queueConnection.connection
    });

    try {
      // Get all repeatable jobs
      const repeatableJobs = await queue.getRepeatableJobs();
      console.log(`  Found ${repeatableJobs.length} repeatable jobs`);

      // Remove each repeatable job
      let removed = 0;
      for (const job of repeatableJobs) {
        try {
          await queue.removeRepeatableByKey(job.key);
          removed++;

          // Log progress every 100 jobs
          if (removed % 100 === 0) {
            console.log(`  Removed ${removed}/${repeatableJobs.length} jobs...`);
          }
        } catch (err) {
          console.error(`  Failed to remove job ${job.key}:`, err);
        }
      }

      console.log(`  ✅ Removed ${removed} repeatable jobs from ${queueName}\n`);

      await queue.close();
    } catch (err) {
      console.error(`  ❌ Error processing ${queueName}:`, err);
    }
  }

  console.log('Cleanup complete!');
  process.exit(0);
};

cleanupRepeatableJobs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
