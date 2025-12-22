import { Command } from 'commander';
import { getBarrabesCli } from '@crawlers/barrabes/dist/cli/crawler.cli';
import { getBikeDiscountCli } from '@crawlers/bike-discount/dist/cli/crawler.cli';
import { getTradeinnCli } from '@crawlers/tradeinn/dist/cli/crawler.cli';
import { publishStockChanges, publishOldStockChanges } from '#publishers/stock';
import { publishCategoriesChange } from '#publishers/categories';
import { publishProductChanges } from '#publishers/product';
import { publishTranslationChanges } from '#publishers/translation';
import { deleteStockCache } from '#infrastructure/stock-cache';
import { publishAttributesChange } from '#publishers/attributes';
import { registerProduct } from '#infrastructure/product-registry';

const crawlersCli = new Command();

crawlersCli.name('crawler')
  .description('CLI to handle @crawlers')
  .version('1.0.0');

const bikeDiscountCli = getBikeDiscountCli(
  publishStockChanges,
  publishOldStockChanges,
  publishCategoriesChange,
  publishProductChanges,
  publishTranslationChanges,
  deleteStockCache,
  registerProduct
);

const barrabesCli = getBarrabesCli(
  publishStockChanges,
  publishCategoriesChange,
  publishProductChanges,
  publishTranslationChanges,
  registerProduct
);

const tradeinnCli = getTradeinnCli(
  publishStockChanges,
  publishCategoriesChange,
  publishProductChanges,
  publishTranslationChanges,
  publishAttributesChange,
  registerProduct
);

crawlersCli.addCommand(bikeDiscountCli);
crawlersCli.addCommand(barrabesCli);
crawlersCli.addCommand(tradeinnCli);

export { crawlersCli };
