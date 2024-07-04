import { Command } from 'commander';
import { getBikeDiscountCli } from '@crawlers/bike-discount/dist/cli/crawler.cli';
import { publishStockChanges, publishOldStockChanges } from '#publishers/stock';
import { publishCategoriesChange } from '#publishers/categories';
import { publishProductChanges } from '#publishers/product';
import { publishTranslationChanges } from '#publishers/translation';

const crawlersCli = new Command();

crawlersCli.name('crawler')
  .description('CLI to handle @crawlers')
  .version('1.0.0');

const bikeDiscountCli = getBikeDiscountCli(
  publishStockChanges,
  publishOldStockChanges,
  publishCategoriesChange,
  publishProductChanges,
  publishTranslationChanges
);

crawlersCli.addCommand(bikeDiscountCli);

export { crawlersCli };
