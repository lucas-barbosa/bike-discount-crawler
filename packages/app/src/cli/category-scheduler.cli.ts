import { Command } from 'commander';
import { enableCategoryCrawler, disableCategoryCrawler } from '#infrastructure/category-registry';
import { triggerCategoryScheduler } from '#queue/category-scheduler';

const categorySchedulerCli = new Command();

categorySchedulerCli.name('category-scheduler')
  .description('CLI to manage category scheduler')
  .version('1.0.0');

// Trigger scheduler
categorySchedulerCli.command('trigger')
  .description('Manually trigger the category scheduler')
  .option('--crawler-id <crawlerId>', 'Trigger for specific crawler only')
  .action(async (options) => {
    await triggerCategoryScheduler(options.crawlerId);
  });

// Enable crawler
categorySchedulerCli.command('enable')
  .description('Enable a crawler in the category scheduler')
  .argument('<crawlerId>', 'Crawler ID (barrabes, bike-discount, tradeinn)')
  .action(async (crawlerId) => {
    await enableCategoryCrawler(crawlerId);
  });

// Disable crawler
categorySchedulerCli.command('disable')
  .description('Disable a crawler in the category scheduler')
  .argument('<crawlerId>', 'Crawler ID (barrabes, bike-discount, tradeinn)')
  .action(async (crawlerId) => {
    await disableCategoryCrawler(crawlerId);
  });

export { categorySchedulerCli };
