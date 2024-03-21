import { disposeCrawler, getClasses, getTextNode, getUrl, startCrawler } from '@crawler/utils/crawler';
import { loginIfRequired } from '@middlewares/login-if-required';
import { type Page } from 'puppeteer';

export const listCategories = async () => {
  const { page, browser } = await startCrawler();

  await page.goto('https://www.bike-discount.de/en');

  await loginIfRequired(page);

  const stores = await findStores(page);
  const categories: BikeDiscountCategory[] = [];

  for (const store of stores) {
    let storeUrl = store.url;
    if (storeUrl.startsWith('/')) storeUrl = 'https://bike-discount.de' + storeUrl;
    await page.goto(storeUrl);
    const storeCategories = await getCategoriesFromStore(page);
    categories.push({
      name: store.name,
      url: store.url,
      childs: storeCategories
    });
  }

  await disposeCrawler(page, browser);
  return categories;
};

const findStores = async (page: Page): Promise<BikeDiscountStore[]> => {
  const items = await page.$$('xpath/.//nav[contains(@class, "navigation-main")]//li//a[contains(@class, "navigation--link")]');

  const stores = await Promise.all(items.map(async (item) => {
    const name = (await getTextNode(page, item)).trim();
    const url = (await item.getProperty('href')).remoteObject().value as string;
    return {
      name,
      url
    };
  }));

  return stores;
};

const getCategoriesFromStore = async (page: Page) => {
  const categories: BikeDiscountCategory[] = [];
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
      categories.push({
        name: categoryName,
        url,
        childs: []
      });
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
      categories[categories.length - 1].childs.push({
        name: categoryName,
        url: await getUrl(page, item),
        childs: await getChildCategories(page, categoryId)
      });
    }
  }

  return categories;
};

const getChildCategories = async (page: Page, categoryId: string) => {
  const className = `box-list-link-${categoryId}`;
  const items = await page.$$(`xpath/.//div[contains(@class, '${className}')]/a[contains(@class, 'navigation--link')]`);

  const subcategories: BikeDiscountCategory[] = [];

  for (const item of items) {
    const [name, url] = await Promise.all([getTextNode(page, item), getUrl(page, item)]);
    subcategories.push({
      name: name.trim(),
      url,
      childs: []
    });
  }

  const promises: Array<Promise<BikeDiscountCategory[]>> = [];
  for (const subcategory of subcategories) {
    promises.push(getNestedCategories(page, subcategory.url));
  }

  const promisesResult = await Promise.all(promises);
  for (let i = 0; i < subcategories.length; i++) {
    subcategories[i].childs = promisesResult[i];
  }

  return subcategories;
};

const getNestedCategories = async (page: Page, url: string) => {
  const browser = page.browser();
  const cookies = await page.cookies();
  const { page: newPage } = await startCrawler(browser, JSON.stringify(cookies));

  if (url.startsWith('/')) url = 'https://bike-discount.de' + url;

  try {
    const hasChilds = [];
    await newPage.goto(url);
    const items = await newPage.$$('xpath/.//a[contains(@class, "current--cat")]/parent::li/ul/li/a');
    const result: BikeDiscountCategory[] = [];

    for (const item of items) {
      const [name, url] = await Promise.all([getTextNode(newPage, item), getUrl(newPage, item)]);
      const category: BikeDiscountCategory = {
        name: name.trim(),
        url,
        childs: []
      };

      const classes = await getClasses(newPage, item);
      if (classes.includes('link--go-forward')) {
        hasChilds.push(category.url);
      }

      result.push(category);
    }

    const promises: Array<Promise<BikeDiscountCategory[]>> = [];
    for (const category of result) {
      if (hasChilds.includes(category.url)) {
        promises.push(getNestedCategories(newPage, category.url));
      } else {
        promises.push(Promise.resolve([]));
      }
    }

    const promisesResult = await Promise.all(promises);
    for (let i = 0; i < result.length; i++) {
      result[i].childs = promisesResult[i];
    }

    await newPage.close();
    return result;
  } catch {
    await newPage.close();
    return [];
  }
};
