import { Command } from 'commander';
import { triggerScheduler } from '#queue/scheduler';

const schedulerCli = new Command();

schedulerCli.name('scheduler')
  .description('CLI to manage stock scheduler')
  .version('1.0.0');

schedulerCli.command('trigger')
  .description('Manually trigger the stock scheduler')
  .option('-c, --crawler-id <crawlerId>', 'Trigger scheduler for a specific crawler (barrabes, bike-discount, tradeinn)')
  .action(async (params) => {
    console.log('Triggering stock scheduler...');
    await triggerScheduler(params.crawlerId);
    console.log('Scheduler job enqueued successfully');
    process.exit(0);
  });

export { schedulerCli };
