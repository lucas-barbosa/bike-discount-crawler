import { parse } from 'csv-parse';
import { Command } from 'commander';
import { createReadStream } from 'fs';
import { exportToCsv } from '@crawlers/base/dist/file/csv';
import { fetchProduct } from '@usecases/fetch-product';
import { fetchStock } from '@usecases/fetch-stock';
import { fetchCategories } from '@usecases/fetch-categories';
import { generateCategoriesTree } from '@usecases/generate-categories-tree';
import { type Product } from '@entities/Product';
import { type ProductStock } from '@entities/ProductStock';
import { type Translation } from '@entities/Translation';
import { getCategories } from '@infrastructure/categories';
import { enqueueStock } from '../queue/stock/index';
import { enqueueCategories } from '../queue/categories';
import { enqueueCategory } from '../queue/category';
import { validateProduct } from '@usecases/validate-product';
import { fetchTranslation } from '@usecases/fetch-translation';

export const getBikeDiscountCli = (
  publishStock: (stock: ProductStock) => Promise<any>,
  publishCategories: (categories: any) => Promise<any>,
  publishProduct: (product: Product) => Promise<any>,
  publishTranslation: (translation: Translation) => Promise<any>
) => {
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
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      console.log('Crawler Product');
      const result = await fetchProduct(params.url, params.category, params.language);

      if (result) {
        await validateProduct(result);
      }

      if (params.publish && result) {
        console.log('Publishing');
        await publishProduct(result);
      }

      console.log(result);
    });

  bikeDiscountCli.command('translate')
    .description('Crawler Translation')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-l, --language <language>', 'Product Language', 'en')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      console.log('Crawler Translation');
      const result = await fetchTranslation(params.url, params.language);
      if (params.publish && result) {
        console.log('Publishing');
        await publishTranslation(result);
      }
      console.log(result);
    });

  bikeDiscountCli.command('categories')
    .description('Crawler Categories')
    .option('-p, --publish', 'Publish to Listeners', false)
    .option('-s, --search', 'Search if not exists', false)
    .option('-e, --enqueue', 'Enqueue job', false)
    .action(async (params) => {
      console.log('Crawler Categories');

      if (params.publish) {
        console.log('Loading from DB');
        let categories = await getCategories();
        if (!categories && params.search) {
          console.log('Loading from Site');
          categories = await fetchCategories();
        }
        if (categories) {
          await publishCategories({
            data: categories,
            crawlerId: 'BD'
          });
          console.log(categories);
        }
      } else if (params.enqueue) {
        await enqueueCategories();
        console.log('Categories enqueued');
      }
    });

  bikeDiscountCli.command('category')
    .description('Crawler Category')
    .option('-u, --url <url>', 'Product Url')
    .option('-e, --enqueue', 'Enqueue job', false)
    .action(async (params) => {
      console.log('Crawler Category');
      if (params.enqueue) {
        await enqueueCategory({
          categoryUrl: params.url
        });
        console.log('Category enqueued');
      }
    });

  bikeDiscountCli.command('categories-tree')
    .description('Generate categories tree')
    .action(async () => {
      console.log('Generating Categories Tree');
      await generateCategoriesTree();
      console.log('Finished');
    });

  return bikeDiscountCli;
};
