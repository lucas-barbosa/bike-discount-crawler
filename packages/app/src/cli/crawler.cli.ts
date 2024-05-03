import { Command } from 'commander';
import { bikeDiscountCli } from '@crawlers/bike-discount/dist/cli/crawler.cli';

const crawlersCli = new Command();

crawlersCli.name('crawler')
  .description('CLI to handle @crawlers')
  .version('1.0.0');

crawlersCli.addCommand(bikeDiscountCli);

export { crawlersCli };
