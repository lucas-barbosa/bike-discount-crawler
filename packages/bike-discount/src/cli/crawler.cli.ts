import { parse } from 'csv-parse';
import { exportToCsv } from '@crawlers/base/dist/file/csv';
import { fetchProduct } from '@usecases/fetch-product';
import { fetchStock } from '@usecases/fetch-stock';
import { Command } from 'commander';
import { createReadStream } from 'fs';
import { type ProductStock } from '@entities/ProductStock';
import { getCategories } from '@infrastructure/categories';
import { enqueueCategories } from '../queue/categories';
import { enqueueStock } from '../queue/stock/index';

export const getBikeDiscountCli = (publishStock: (stock: ProductStock) => Promise<any>, publishCategories: (categories: any) => Promise<any>) => {
  const bikeDiscountCli = new Command();

  bikeDiscountCli.name('bike-discount')
    .description('CLI to handle @crawlers/bike-discount')
    .version('1.0.0');

  const crawlerStockRequest = async (url: string, fileName?: string, withHeader = true, sendToApi = false) => {
    const result = await fetchStock(url)
      .catch((err: any) => {
        console.error(`Failed to retrieve ${url}!`, err);
        return null;
      });

    if (!result) {
      return;
    }

    if (fileName) {
      const data = [
        result,
        ...(result?.variations?.flat() ?? [])
      ];
      exportToCsv(fileName, data, ['id', 'price', 'availability'], withHeader);
      return;
    }

    if (sendToApi) {
      console.log('Publishing');
      await publishStock(result);
    }
    console.log(result);
  };

  bikeDiscountCli.command('import')
    .description('Command to import urls to crawler')
    .option('-s, --stock <stock>', 'Stock File path')
    .action(async (params) => {
      console.log('Import File');

      if (params.stock) {
        const stream = createReadStream(params.stock).pipe(parse());
        for await (const url of stream) {
          await enqueueStock(url);
        }
      }

      console.log('Finished');
    });

  bikeDiscountCli.command('stock')
    .description('Crawler Product Stock')
    .option('-u, --url <url>', 'Product Url')
    .option('-f, --file <file>', 'Import from CSV', '')
    .option('--csv', 'Export to CSV', false)
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      console.log('Crawler Product Stock');
      const filename = params.csv ? `stock-${Date.now()}.csv` : undefined;

      if (params.url) {
        await crawlerStockRequest(params.url, filename, true, params.publish);
        return;
      }

      if (params.file) {
        let printHeader = true;
        console.time('Processing CSV');
        const stream = createReadStream(params.file).pipe(parse());
        let i = 0;
        for await (const url of stream) {
          await crawlerStockRequest(url, filename, printHeader, params.publish);
          printHeader = false;
          console.log(++i);
        }
        console.timeEnd('Processing CSV');
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

  bikeDiscountCli.command('categories')
    .description('Crawler Categories')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      console.log('Crawler Categories');

      if (params.publish) {
        const categories = await getCategories();
        await publishCategories({
          data: categories,
          crawlerId: 'BD'
        });
      } else {
        await enqueueCategories();
      }
      console.log('Categories enqueued');
    });

  return bikeDiscountCli;
};
