import { Command } from 'commander';
import { getBikeDiscountCli } from '@crawlers/bike-discount/dist/cli/crawler.cli';
import { publishStockChanges } from '#publishers/stock';

const crawlersCli = new Command();

crawlersCli.name('crawler')
  .description('CLI to handle @crawlers')
  .version('1.0.0');

const bikeDiscountCli = getBikeDiscountCli(publishStockChanges);
crawlersCli.addCommand(bikeDiscountCli);

export { crawlersCli };
