import { getClasses, getTextNode, getUrl, startCrawler } from '@crawler/utils/crawler';
import { runAndDispose } from '@crawlers/base/dist/crawler/utils';
import { logger } from '@crawlers/base/dist/utils/logger';
import { loginIfRequired } from '@middlewares/login-if-required';
import { type Page } from 'puppeteer';

// Concurrency limit for parallel fetching
const BATCH_SIZE = 5;

// Internal type for categories that may need deeper fetching
type CategoryToProcess = BikeDiscountCategory & { needsDeepFetch?: boolean };

/**
 * Main entry point - fetches all categories from bike-discount.de
 */
export const listCategories = async () => {
  const { page, browser } = await startCrawler();

  // Phase 1: Collect all category structure and URLs (holds the page)
  const { categories, subcategoriesToFetch } = await runAndDispose(async () => {
    await page.goto('https://www.bike-discount.de/en');
    await loginIfRequired(page);

    const stores = await findStores(page);
    const categories: BikeDiscountCategory[] = [];
    const allSubcategoriesToFetch: BikeDiscountCategory[] = [];

    for (const store of stores) {
      logger.info({ store: store.name }, 'Processing store');
      let storeUrl = store.url;
      if (storeUrl.startsWith('/')) storeUrl = 'https://bike-discount.de' + storeUrl;
      await page.goto(storeUrl);

      const { storeCategories, subcategoriesToFetch } = await getCategoriesFromStore(page);
      allSubcategoriesToFetch.push(...subcategoriesToFetch);
      categories.push({
        name: store.name,
        url: store.url,
        childs: storeCategories
      });
    }

    logger.info({
      stores: categories.length,
      subcategoriesToFetch: allSubcategoriesToFetch.length
    }, 'Finished collecting top-level categories');

    return { categories, subcategoriesToFetch: allSubcategoriesToFetch };
  }, page, browser);

  // Phase 2: Fetch all nested categories AFTER releasing the first page
  if (subcategoriesToFetch.length > 0) {
    await populateNestedCategories(subcategoriesToFetch);
  }

  return categories;
};

const findStores = async (page: Page): Promise<BikeDiscountStore[]> => {
  const items = await page.$$('xpath/.//nav[contains(@class, "navigation-main")]//li//a[contains(@class, "navigation--link")]');

  return Promise.all(items.map(async (item) => {
    const name = (await getTextNode(page, item)).trim();
    const url = (await item.getProperty('href')).remoteObject().value as string;
    return { name, url };
  }));
};

const getCategoriesFromStore = async (page: Page) => {
  const categories: BikeDiscountCategory[] = [];
  const allSubcategoriesToFetch: BikeDiscountCategory[] = [];
  const items = await page.$$('xpath/.//div[contains(@class, "sub-navigation")]/ul/li//a[contains(@class, "navigation--link")]');

  for (const item of items) {
    const categoryName = (await getTextNode(page, item)).trim();
    const itemprop = await page.evaluate(x => x.getAttribute('itemprop'), item);

    if (!!itemprop && ['SALE', 'NEW RELEASES'].includes(categoryName.toUpperCase())) {
      break;
    }

    const classes = await getClasses(page, item);
    if (itemprop) {
      const url = await getUrl(page, item);
      categories.push({ name: categoryName, url, childs: [] });
    } else if (!classes.includes('level2')) {
      let categoryId = await page.evaluate(x => x.id, item);
      let parentElement, parentTagName;
      let i = 0;
      do {
        parentElement = await item.evaluateHandle(x => x.parentElement);
        parentTagName = parentElement ? await page.evaluate(x => x?.tagName ?? '', parentElement) : '';
        if (++i === 3) break;
      } while (parentTagName.toLowerCase() !== 'li');
      categoryId = parentElement ? await page.evaluate(x => x?.id ?? '', parentElement) : '';
      categoryId = categoryId?.replace(/[^0-9]/g, '');

      const childCategories = await getChildCategories(page, categoryId);
      allSubcategoriesToFetch.push(...childCategories);

      categories[categories.length - 1].childs.push({
        name: categoryName,
        url: await getUrl(page, item),
        childs: childCategories
      });
    }
  }

  return { storeCategories: categories, subcategoriesToFetch: allSubcategoriesToFetch };
};

const getChildCategories = async (page: Page, categoryId: string): Promise<BikeDiscountCategory[]> => {
  const className = `box-list-link-${categoryId}`;
  const items = await page.$$(`xpath/.//div[contains(@class, '${className}')]/a[contains(@class, 'navigation--link')]`);

  const subcategories: BikeDiscountCategory[] = [];
  for (const item of items) {
    const [name, url] = await Promise.all([getTextNode(page, item), getUrl(page, item)]);
    subcategories.push({ name: name.trim(), url, childs: [] });
  }

  return subcategories;
};

/**
 * Fetches category data from a single URL.
 * Returns categories found and URLs that need deeper fetching.
 * Page is fully released after this function returns.
 */
const fetchCategoryPage = async (url: string): Promise<{ categories: CategoryToProcess[], deeperUrls: string[] }> => {
  const { page, browser } = await startCrawler();

  return runAndDispose(async () => {
    const fullUrl = url.startsWith('/') ? 'https://bike-discount.de' + url : url;

    await page.goto(fullUrl);
    const items = await page.$$('xpath/.//a[contains(@class, "current--cat")]/parent::li/ul/li/a');

    const categories: CategoryToProcess[] = [];
    const deeperUrls: string[] = [];

    for (const item of items) {
      const [name, itemUrl, classes] = await Promise.all([
        getTextNode(page, item),
        getUrl(page, item),
        getClasses(page, item)
      ]);

      const needsDeepFetch = classes.includes('link--go-forward');
      if (needsDeepFetch) {
        deeperUrls.push(itemUrl);
      }

      categories.push({
        name: name.trim(),
        url: itemUrl,
        childs: [],
        needsDeepFetch
      });
    }

    return { categories, deeperUrls };
  }, page, browser);
};

/**
 * Recursively fetches nested categories for a URL and all its children.
 * Each level acquires and releases its own page before recursing.
 */
const fetchNestedForUrl = async (url: string): Promise<BikeDiscountCategory[]> => {
  try {
    // Step 1: Fetch this level (page is acquired and released here)
    const { categories, deeperUrls } = await fetchCategoryPage(url);

    if (deeperUrls.length === 0) {
      // No deeper levels - clean up metadata and return
      return categories.map(({ needsDeepFetch, ...cat }) => cat);
    }

    // Step 2: AFTER page is released, fetch deeper levels in batches
    logger.debug({ url, deeperCount: deeperUrls.length }, 'Fetching deeper nested categories');
    const deeperResults = await processBatched(deeperUrls, fetchNestedForUrl);

    // Map deeper results back to categories
    let deeperIndex = 0;
    for (const category of categories) {
      if (category.needsDeepFetch) {
        category.childs = deeperResults[deeperIndex++];
      }
      delete category.needsDeepFetch;
    }

    return categories;
  } catch (error) {
    logger.error({ url, error: (error as Error).message }, 'Failed to fetch nested categories');
    return [];
  }
};

/**
 * Process items in batches with limited concurrency
 */
const processBatched = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  const total = items.length;

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const progress = Math.min(i + BATCH_SIZE, total);
    logger.debug({ progress, total }, 'Processing batch');

    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }

  return results;
};

/**
 * Populates nested categories for all subcategories
 */
const populateNestedCategories = async (subcategories: BikeDiscountCategory[]): Promise<void> => {
  logger.info({ total: subcategories.length, batchSize: BATCH_SIZE }, 'Fetching nested categories');

  const results = await processBatched(subcategories, sub => fetchNestedForUrl(sub.url));

  for (let i = 0; i < subcategories.length; i++) {
    subcategories[i].childs = results[i];
  }

  logger.info({ total: subcategories.length }, 'Completed nested category fetch');
};
