import { Command } from 'commander';
import { getBikeDiscountCli } from '@crawlers/bike-discount/dist/cli/crawler.cli';
import { publishStockChanges } from '#publishers/stock';
import { publishCategoriesChange } from '#publishers/categories';

const crawlersCli = new Command();

crawlersCli.name('crawler')
  .description('CLI to handle @crawlers')
  .version('1.0.0');

const bikeDiscountCli = getBikeDiscountCli(publishStockChanges, publishCategoriesChange);
crawlersCli.addCommand(bikeDiscountCli);

export { crawlersCli };
