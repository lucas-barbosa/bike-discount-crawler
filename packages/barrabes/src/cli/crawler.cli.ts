import { createReadStream } from 'node:fs';
import { Command } from 'commander';
import { parse } from 'csv-parse';
import { logger } from '@crawlers/base';

import { type Product } from '@crawlers/base/dist/types/Product';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { type ProductTranslation } from '@crawlers/base/dist/types/ProductTranslation';

import { fetchProduct } from '@usecases/fetch-product';
import { fetchStock } from '@usecases/fetch-stock';
import { fetchCategories } from '@usecases/fetch-categories';
import { generateCategoriesTree } from '@usecases/generate-categories-tree';
import { fetchProductList } from '@usecases/fetch-product-list';
import { getCategories } from '@infrastructure/categories';
import { fetchTranslation } from '@usecases/fetch-translation';
import { validateProduct } from '@usecases/validate-product';
import { enqueueCategories } from '../queue/categories';
import { enqueueCategory, enqueueSelectedCategories } from '../queue/category';
import { enqueueProductImage } from '../queue/product-image';

export const getBarrabesCli = (
  publishStock?: (stock: ProductStock) => Promise<any>,
  publishCategories?: (categories: any) => Promise<any>,
  publishProduct?: (product: Product) => Promise<any>,
  publishTranslation?: (translation: ProductTranslation) => Promise<any>,
  registerProduct?: (crawlerId: string, productUrl: string, type?: 'stock' | 'old-stock', metadata?: any) => Promise<void>
) => {
  const barrabesCli = new Command();

  barrabesCli.name('barrabes')
    .description('CLI to handle @crawlers/barrabes')
    .version('1.0.0');

  barrabesCli.command('stock')
    .description('Crawler Product Stock')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-p, --publish', 'Publish to Listeners', false)
    .option('-pp, --pro', 'Is Pro Website', false)
    .action(async (params) => {
      logger.info('Crawler Product Stock');

      const result = await fetchStock(params.url, params.pro)
        .catch((err: any) => {
          logger.error({ err }, 'Failed to retrieve stock!');
          return null;
        });

      if (!result) {
        logger.info('No result');
        return;
      }

      if (publishStock && params.publish) {
        logger.info('Publishing');
        await publishStock(result);
      }

      logger.info(result);
    });

  barrabesCli.command('import')
    .description('Command to import urls to crawler')
    .option('-s, --stock <stock>', 'Stock File path')
    .option('-i, --images <images>', 'Product Images File path')
    .action(async (params) => {
      logger.info('Import File');

      if (params.stock && registerProduct) {
        const stream = createReadStream(params.stock).pipe(parse());
        let count = 0;
        for await (const url of stream) {
          const productUrl = Array.isArray(url) ? url[0] : url;
          const isPro = productUrl.includes('barrabes.com/pro/');
          await registerProduct('barrabes', productUrl, 'stock', { isPro });
          count++;
        }
        logger.info({ count }, 'Registered stock products');
      }

      if (params.images) {
        const stream = createReadStream(params.images).pipe(parse());
        for await (const url of stream) {
          const productUrl = Array.isArray(url) ? url[0] : url;
          await enqueueProductImage(productUrl);
        }
      }

      logger.info('Finished');
    });

  barrabesCli.command('product')
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

      if (publishProduct && params.publish && result) {
        logger.info('Publishing');
        await publishProduct(result);
      }

      logger.info(result);
    });

  barrabesCli.command('translate')
    .description('Crawler Translation')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-l, --language <language>', 'Product Language', 'en')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      logger.info('Crawler Translation');
      const result = await fetchTranslation(params.url, params.language);

      if (publishTranslation && params.publish && result) {
        logger.info('Publishing');
        await publishTranslation(result);
      }

      logger.info(result);
    });

  barrabesCli.command('categories')
    .description('Crawler Categories')
    .option('-p, --publish', 'Publish to Listeners', false)
    .option('-s, --search', 'Search if not exists', false)
    .option('-e, --enqueue', 'Enqueue job', false)
    .action(async (params) => {
      logger.info('Crawler Categories');

      if (params.publish) {
        logger.info('Loading from DB');
        let categories = await getCategories();

        if ((!categories?.barrabes?.length) && params.search) {
          logger.info('Loading from Site');
          categories = await fetchCategories();
          logger.info('Loaded');
        }

        if (publishCategories && categories) {
          await publishCategories({
            data: categories,
            crawlerId: 'BB'
          });
        }
        logger.info(categories);
      } else if (params.enqueue) {
        await enqueueCategories();
        logger.info('Categories enqueued');
      }
    });

  barrabesCli.command('category')
    .description('Crawler Category')
    .option('-u, --url <url>', 'Product Url')
    .option('-f, --find', 'Find category', false)
    .option('-e, --enqueue', 'Enqueue job', false)
    .option('-s, --selected', 'Enqueue selected categories', false)
    .action(async (params) => {
      logger.info('Crawler Category');

      if (params.find) {
        const result = await fetchProductList(params.url);
        logger.info(result);
      }

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

  barrabesCli.command('categories-tree')
    .description('Generate categories tree')
    .action(async () => {
      logger.info('Generating Categories Tree');
      await generateCategoriesTree();
      logger.info('Finished');
    });

  return barrabesCli;
};
