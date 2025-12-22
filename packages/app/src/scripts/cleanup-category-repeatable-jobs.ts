import { Queue } from 'bullmq';
import { queueConnection } from '@crawlers/base/dist/queue/client';

/**
 * Clean up all repeatable jobs from category queues
 * This removes the old recurring jobs (individual jobs per category)
 */
const cleanupCategoryRepeatableJobs = async () => {
  const queueNames = [
    'barrabes.category',
    'bike_discount.category',
    'tradeinn.category'
  ];

  console.log('Starting cleanup of category repeatable jobs...\n');

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

          // Log progress every 10 jobs
          if (removed % 10 === 0) {
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

cleanupCategoryRepeatableJobs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
