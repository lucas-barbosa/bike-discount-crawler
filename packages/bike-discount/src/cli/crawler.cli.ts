import { parse } from 'csv-parse';
import { Command } from 'commander';
import { createReadStream } from 'fs';
import { exportToCsv } from '@crawlers/base/dist/file/csv';
import { logger } from '@crawlers/base';
import { fetchProduct } from '@usecases/fetch-product';
import { fetchStock } from '@usecases/fetch-stock';
import { fetchCategories } from '@usecases/fetch-categories';
import { generateCategoriesTree } from '@usecases/generate-categories-tree';
import { type Product } from '@entities/Product';
import { type Translation } from '@entities/Translation';
import { getCategories } from '@infrastructure/categories';
import { enqueueCategories } from '../queue/categories';
import { enqueueCategory } from '../queue/category';
import { type OldStockResult } from '../queue/old-stock';
import { validateProduct } from '@usecases/validate-product';
import { fetchTranslation } from '@usecases/fetch-translation';
import { fetchOldStocks } from '@usecases/fetch-old-stocks';
import { enqueueSelectedCategories } from '@usecases/enqueue-selected-categories';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';

export const getBikeDiscountCli = (
  publishStock: (stock: ProductStock) => Promise<any>,
  publishOldStock: (data: OldStockResult) => Promise<any>,
  publishCategories: (categories: any) => Promise<any>,
  publishProduct: (product: Product) => Promise<any>,
  publishTranslation: (translation: Translation) => Promise<any>,
  deleteStockCache: (productId: string, crawlerId: string) => Promise<any>,
  registerProduct: (crawlerId: string, productUrl: string, type?: 'stock' | 'old-stock', metadata?: any) => Promise<void>
) => {
  const bikeDiscountCli = new Command();

  bikeDiscountCli.name('bike-discount')
    .description('CLI to handle @crawlers/bike-discount')
    .version('1.0.0');

  const crawlerStockRequest = async (url: string, fileName?: string, withHeader = true, sendToApi = false) => {
    const result = await fetchStock(url)
      .catch((err: any) => {
        logger.error({ url, err }, 'Failed to retrieve stock');
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
      logger.info('Publishing');
      await publishStock(result);
    }
    logger.info(result, 'Result');
  };

  bikeDiscountCli.command('import')
    .description('Command to import urls to crawler')
    .option('-s, --stock <stock>', 'Stock File path')
    .option('-o, --oldStock <oldStock>', 'Old Stock File path')
    .action(async (params) => {
      logger.info('Import File');

      if (params.stock) {
        const stream = createReadStream(params.stock).pipe(parse());
        let count = 0;
        for await (const url of stream) {
          await registerProduct('bike-discount', url, 'stock');
          count++;
        }
        logger.info({ count }, 'Registered stock products');
      } else if (params.oldStock) {
        const stream = createReadStream(params.oldStock).pipe(parse());
        const grouped: Record<string, {
          url: string
          items: any[]
        }> = {};
        for await (const [id, url, variation] of stream) {
          if (!id || !url || !variation) continue;
          const key = url as string;
          if (!grouped[key]) {
            grouped[key] = {
              url,
              items: [{ productId: id, variationName: variation }]
            };
          } else {
            grouped[key].items.push({ productId: id, variationName: variation });
          }
        }

        let count = 0;
        for (const [url, data] of Object.entries(grouped)) {
          await registerProduct('bike-discount', url, 'old-stock', {
            url: data.url,
            variations: data.items
          });
          count++;
        }
        logger.info({ count }, 'Registered old-stock products');
      }

      logger.info('Finished');
    });

  bikeDiscountCli.command('remove-cache')
    .description('Remove Stock cache')
    .option('-o, --oldStock <oldStock>', 'Old Stock File path')
    .action(async (params) => {
      if (params.oldStock) {
        const stream = createReadStream(params.oldStock).pipe(parse());

        for await (const [id, url, variation] of stream) {
          if (!id || !url || !variation) continue;
          await deleteStockCache(id, 'BD');
        }
      }
    });

  bikeDiscountCli.command('stock')
    .description('Crawler Product Stock')
    .option('-u, --url <url>', 'Product Url')
    .option('-f, --file <file>', 'Import from CSV', '')
    .option('--csv', 'Export to CSV', false)
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      logger.info('Crawler Product Stock');
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
          i++;
          if (i % 100 === 0) logger.info({ count: i }, 'Progress...');
        }
        console.timeEnd('Processing CSV');
      }
    });

  bikeDiscountCli.command('old-stock')
    .description('Crawler Old Product Stock')
    .requiredOption('-u, --url <url>', 'Product Url')
    .requiredOption('-i, --ids <ids>', 'Product Ids')
    .requiredOption('-v, --variations <variations>', 'Product Variations')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      logger.info('Crawler Old Product Stock');

      const ids = params.ids.split(',');
      const variations = params.variations.split(',');

      if (!ids.length || ids.length !== variations.length) {
        logger.warn('Forneça a mesma quantidade de ids e variações!');
        return;
      }

      const products = ids.map((id: string, index: number) => ({ productId: id, variationName: variations[index] }));
      const result = await fetchOldStocks(params.url, products);

      if (params.publish && result) {
        logger.info('Publishing');
        await publishOldStock(result);
      }

      logger.info(result);
    });

  bikeDiscountCli.command('product')
    .description('Crawler Product')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-c, --category <category>', 'Category Url', '')
    .option('-l, --language <language>', 'Product Language', '')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      logger.info('Crawler Product');
      const result = await fetchProduct(params.url, params.category, params.language);

      if (result) {
        await validateProduct(result);
      }

      if (params.publish && result) {
        logger.info('Publishing');
        await publishProduct(result);
      }

      logger.info(result, 'Result');
    });

  bikeDiscountCli.command('translate')
    .description('Crawler Translation')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-l, --language <language>', 'Product Language', 'en')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      logger.info('Crawler Translation');
      const result = await fetchTranslation(params.url, params.language);
      if (params.publish && result) {
        logger.info('Publishing');
        await publishTranslation(result);
      }
      logger.info(result, 'Result');
    });

  bikeDiscountCli.command('categories')
    .description('Crawler Categories')
    .option('-p, --publish', 'Publish to Listeners', false)
    .option('-s, --search', 'Search if not exists', false)
    .option('-e, --enqueue', 'Enqueue job', false)
    .action(async (params) => {
      logger.info('Crawler Categories');

      if (params.publish) {
        logger.info('Loading from DB');
        let categories = await getCategories();
        if (!categories && params.search) {
          logger.info('Loading from Site');
          categories = await fetchCategories();
        }
        if (categories) {
          await publishCategories({
            data: categories,
            crawlerId: 'BD'
          });
          logger.info(categories, 'Categories');
        }
      } else if (params.enqueue) {
        await enqueueCategories();
        logger.info('Categories enqueued');
      }
    });

  bikeDiscountCli.command('category')
    .description('Crawler Category')
    .option('-u, --url <url>', 'Product Url')
    .option('-e, --enqueue', 'Enqueue job', false)
    .option('-s, --selected', 'Enqueue selected categories', false)
    .action(async (params) => {
      logger.info('Crawler Category');
      if (params.enqueue) {
        await enqueueCategory({
          categoryUrl: params.url
        });
        logger.info('Category enqueued');
      }
      if (params.selected) {
        logger.info('Enqueuing selected-categories');
        await enqueueSelectedCategories();
        logger.info('Selected-categories enqueued');
      }
    });

  bikeDiscountCli.command('categories-tree')
    .description('Generate categories tree')
    .action(async () => {
      logger.info('Generating Categories Tree');
      await generateCategoriesTree();
      logger.info('Finished');
    });

  return bikeDiscountCli;
};
