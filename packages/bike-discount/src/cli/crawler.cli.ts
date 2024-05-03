import { parse } from 'csv-parse';
import { exportToCsv } from '@crawlers/base/dist/file/csv';
import { fetchProduct } from '@usecases/fetch-product';
import { fetchStock } from '@usecases/fetch-stock';
import { Command } from 'commander';
import { createReadStream } from 'fs';

const bikeDiscountCli = new Command();

bikeDiscountCli.name('bike-discount')
  .description('CLI to handle @crawlers/bike-discount')
  .version('1.0.0');

const crawlerStockRequest = async (url: string, fileName?: string, withHeader = true) => {
  const result = await fetchStock(url);

  if (fileName) {
    const data = [
      result,
      ...(result?.variations?.flat() ?? [])
    ];
    exportToCsv(fileName, data, ['id', 'price', 'availability'], withHeader);
    return;
  }

  console.log(result);
};

bikeDiscountCli.command('stock')
  .description('Crawler Product Stock')
  .option('-u, --url <url>', 'Product Url')
  .option('-f, --file <file>', 'Import from CSV', '')
  .option('--csv', 'Export to CSV', false)
  .action(async (params) => {
    console.log('Crawler Product Stock');
    if (params.url) {
      const result = await fetchStock(params.url);
      const filename = params.csv ? `stock-${result?.id}-${Date.now()}.csv` : undefined;
      await crawlerStockRequest(params.url, filename);
      return;
    }

    if (params.file) {
      let printHeader = true;
      const filename = params.csv ? `stocks-${Date.now()}.csv` : undefined;
      const stream = createReadStream(params.file).pipe(parse());

      for await (const url of stream) {
        await crawlerStockRequest(url, filename, printHeader);
        printHeader = false;
      }
    }
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
