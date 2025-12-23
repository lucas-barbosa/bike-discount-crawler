import { createReadStream } from 'node:fs';
import { Command } from 'commander';
import { parse } from 'csv-parse';

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
import { CRAWLER_ID } from '../config';
import { enqueueProductImage } from '../queue/product-image';
import { getAttributes } from '@infrastructure/attributes';

export const getTradeinnCli = (
  publishStock?: (stock: ProductStock) => Promise<any>,
  publishCategories?: (categories: any) => Promise<any>,
  publishProduct?: (product: Product) => Promise<any>,
  publishTranslation?: (translation: ProductTranslation) => Promise<any>,
  publishAttributes?: (attributes: any) => Promise<any>,
  registerProduct?: (crawlerId: string, productUrl: string, type?: 'stock' | 'old-stock', metadata?: any) => Promise<void>
) => {
  const tradeinnCli = new Command();

  tradeinnCli.name('tradeinn')
    .description('CLI to handle @crawlers/tradeinn')
    .version('1.0.0');

  tradeinnCli.command('stock')
    .description('Crawler Product Stock')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-p, --publish', 'Publish to Listeners', false)
    .option('-pp, --pro', 'Is Pro Website', false)
    .action(async (params) => {
      console.log('Crawler Product Stock');

      const result = await fetchStock(params.url)
        .catch((err: any) => {
          console.error('Failed to retrieve stock!', err);
          return null;
        });

      if (!result) {
        console.log('No result');
        return;
      }

      if (publishStock && params.publish) {
        console.log('Publishing');
        await publishStock(result);
      }

      console.log(result);
    });

  tradeinnCli.command('import')
    .description('Command to import urls to crawler')
    .option('-s, --stock <stock>', 'Stock File path')
    .option('-i, --images <images>', 'Product Images File path')
    .action(async (params) => {
      console.log('Import File');

      if (params.stock && registerProduct) {
        const stream = createReadStream(params.stock).pipe(parse());
        let count = 0;
        for await (const url of stream) {
          const productUrl = Array.isArray(url) ? url[0] : url;
          await registerProduct('tradeinn', productUrl, 'stock');
          count++;
        }
        console.log(`Registered ${count} stock products`);
      }

      if (params.images) {
        const stream = createReadStream(params.images).pipe(parse());
        for await (const url of stream) {
          const productUrl = Array.isArray(url) ? url[0] : url;
          await enqueueProductImage(productUrl);
        }
      }

      console.log('Finished');
    });

  tradeinnCli.command('product')
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

      if (publishProduct && params.publish && result) {
        console.log('Publishing');
        await publishProduct(result);
      }

      console.log(result);
    });

  tradeinnCli.command('translate')
    .description('Crawler Translation')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-l, --language <language>', 'Product Language', 'en')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      console.log('Crawler Translation');
      const result = await fetchTranslation(params.url, params.language);

      if (publishTranslation && params.publish && result) {
        console.log('Publishing');
        await publishTranslation(result);
      }

      console.log(result);
    });

  tradeinnCli.command('categories')
    .description('Crawler Categories')
    .option('-p, --publish', 'Publish to Listeners', false)
    .option('-s, --search', 'Search if not exists', false)
    .option('-e, --enqueue', 'Enqueue job', false)
    .action(async (params) => {
      console.log('Crawler Categories');

      if (params.publish) {
        console.log('Loading from DB');
        let categories = await getCategories();
        let attributes = await getAttributes();

        if (!categories && params.search) {
          console.log('Loading from Site');

          const result = await fetchCategories();
          categories = result.categories;
          attributes = result.attributes;

          console.log('Loaded');
        }

        if (publishCategories && categories) {
          await publishCategories({
            data: categories,
            crawlerId: CRAWLER_ID
          });
        }

        if (publishAttributes && attributes && attributes?.length > 0) {
          await publishAttributes({
            data: attributes,
            crawlerId: CRAWLER_ID
          });
        }

        console.log(categories);
        console.log(attributes);
      } else if (params.enqueue) {
        await enqueueCategories();
        console.log('Categories enqueued');
      }
    });

  tradeinnCli.command('category')
    .description('Crawler Category')
    .option('-u, --url <url>', 'Product Url')
    .option('-f, --find', 'Find category', false)
    .option('-e, --enqueue', 'Enqueue job', false)
    .option('-s, --selected', 'Enqueue selected categories', false)
    .action(async (params) => {
      console.log('Crawler Category');

      if (params.find) {
        const result = await fetchProductList(params.url);
        console.log(result);
      }

      if (params.enqueue) {
        await enqueueCategory({
          categoryUrl: params.url
        });
        console.log('Category enqueued');
      }

      if (params.selected) {
        console.log('Enqueuing selected-categories');
        await enqueueSelectedCategories();
        console.log('Selected-categories enqueued');
      }
    });

  tradeinnCli.command('categories-tree')
    .description('Generate categories tree')
    .action(async () => {
      console.log('Generating Categories Tree');
      await generateCategoriesTree();
      console.log('Finished');
    });

  return tradeinnCli;
};
