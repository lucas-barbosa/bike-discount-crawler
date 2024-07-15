import { Command } from 'commander';

import { fetchProduct } from '@usecases/fetch-product';
import { fetchStock } from '@usecases/fetch-stock';
import { fetchCategories } from '@usecases/fetch-categories';
import { generateCategoriesTree } from '@usecases/generate-categories-tree';

import { Product } from '@crawlers/base/dist/types/Product';
import { ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { ProductTranslation } from '@crawlers/base/dist/types/ProductTranslation';
import { fetchProductList } from '@usecases/fetch-product-list';
import { getCategories } from '@infrastructure/categories';
import { fetchTranslation } from '@usecases/fetch-translation';

export const getBarrabesCli = (
  publishStock?: (stock: ProductStock) => Promise<any>,
  publishCategories?: (categories: any) => Promise<any>,
  publishProduct?: (product: Product) => Promise<any>,
  publishTranslation?: (translation: ProductTranslation) => Promise<any>
) => {
  const barrabesCli = new Command();

  barrabesCli.name('barrabes')
    .description('CLI to handle @crawlers/barrabes')
    .version('1.0.0');


  barrabesCli.command('stock')
    .description('Crawler Product Stock')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      console.log('Crawler Product Stock');

      const result = await fetchStock(params.url)
        .catch((err: any) => {
          console.error(`Failed to retrieve stock!`, err);
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

      console.log(result)
    });

  barrabesCli.command('product')
    .description('Crawler Product')
    .requiredOption('-u, --url <url>', 'Product Url')
    .option('-c, --category <category>', 'Category Url', '')
    .option('-l, --language <language>', 'Product Language', '')
    .option('-p, --publish', 'Publish to Listeners', false)
    .action(async (params) => {
      console.log('Crawler Product');
      const result = await fetchProduct(params.url, params.category, params.language);

      if (result) {
        // await validateProduct(result);
      }

      if (publishProduct && params.publish && result) {
        console.log('Publishing');
        await publishProduct(result);
      }

      console.log(result);
    });

  barrabesCli.command('translate')
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

  barrabesCli.command('categories')
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
          console.log('Loaded');
        }

        if (publishCategories && categories) {
          await publishCategories({
            data: categories,
            crawlerId: 'BB'
          });
        }
        console.log(categories);
      } else if (params.enqueue) {
        // await enqueueCategories();
        // console.log('Categories enqueued');
      }
    });

  barrabesCli.command('category')
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

      // if (params.enqueue) {
      //   await enqueueCategory({
      //     categoryUrl: params.url
      //   });
      //   console.log('Category enqueued');
      // }

      // if (params.selected) {
      //   console.log('Enqueuing selected-categories');
      //   await enqueueSelectedCategories();
      //   console.log('Selected-categories enqueued');
      // }
    });

  barrabesCli.command('categories-tree')
    .description('Generate categories tree')
    .action(async () => {
      console.log('Generating Categories Tree');
      await generateCategoriesTree();
      console.log('Finished');
    });

  return barrabesCli;
};