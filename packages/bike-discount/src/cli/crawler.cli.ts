import { fetchProduct } from '@usecases/fetch-product';
import { fetchStock } from '@usecases/fetch-stock';
import { Command } from 'commander';

const bikeDiscountCli = new Command();

bikeDiscountCli.name('bike-discount')
  .description('CLI to handle @crawlers/bike-discount')
  .version('1.0.0');

bikeDiscountCli.command('stock')
  .description('Crawler Product Stock')
  .requiredOption('-u, --url <url>', 'Product Url')
  .action(async (params) => {
    console.log('Crawler Product Stock');
    const result = await fetchStock(params.url);
    console.log(result);
  });

bikeDiscountCli.command('product')
  .description('Crawler Product')
  .requiredOption('-u, --url <url>', 'Product Url')
  .option('-c, --category <category>', 'Category Url', '')
  .option('-l, --language <language>', 'Product Language', '')
  .action(async (params) => {
    console.log('Crawler Product');
    const result = await fetchProduct(params.url, params.category, params.language);
    console.log(result);
  });

export { bikeDiscountCli };
