import { Command } from 'commander';
import { triggerScheduler } from '#queue/scheduler';
import { logger } from '@crawlers/base';

const schedulerCli = new Command();

schedulerCli.name('scheduler')
  .description('CLI to manage stock scheduler')
  .version('1.0.0');

schedulerCli.command('trigger')
  .description('Manually trigger the stock scheduler')
  .option('-c, --crawler-id <crawlerId>', 'Trigger scheduler for a specific crawler (barrabes, bike-discount, tradeinn)')
  .action(async (params) => {
    logger.info('Triggering stock scheduler...');
    await triggerScheduler(params.crawlerId);
    logger.info('Scheduler job enqueued successfully');
    process.exit(0);
  });

export { schedulerCli };
