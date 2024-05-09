import { type Page } from 'puppeteer';
import { disposeCrawler, getPropertyContent, startCrawler } from '@crawler/utils/crawler';
import { loginIfRequired } from '@middlewares/login-if-required';
import { ProductVariation } from '@entities/ProductVariation';
import { ProductStock } from '@entities/ProductStock';

export const getProductStock = async (productUrl: string, dispose?: boolean, language?: string) => {
  const { page, browser } = await startCrawler();

  if (language) {
    productUrl = productUrl.replace(/(bike-discount\.de\/)[a-z]{2}(\/)/, `$1${language}$2`);
  }

  const query = new URLSearchParams({
    __delivery: '279'
  });

  await page.goto(`${productUrl}?${query.toString()}`);
  await loginIfRequired(page);

  const [
    availability,
    id,
    price,
    sku,
    variations
  ] = await Promise.all([
    getAvailability(page),
    getId(page),
    getPrice(page),
    getSku(page),
    getVariations(page)
  ]);

  const stock = new ProductStock(
    id,
    Number(price),
    sku,
    availability
  );

  stock.crawlerId = 'BD';
  stock.variations = variations;

  if (dispose) await disposeCrawler(page, browser);
  return {
    stock,
    page,
    browser
  };
};

const getAvailability = async (page: Page) => {
  const stocks = await page.$$('xpath/.//div[contains(@class, "shipping--info")]/ul/li/text()[contains(translate(.,"abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "IN STOCK")]');
  return stocks.length === 1 ? 'instock' : 'outofstock';
};

const getId = async (page: Page) => {
  const element = await page.$$('xpath/.//meta[@itemprop = "productID"]');
  if (element.length) {
    return await getPropertyContent(page, element[0]);
  }
  return getSku(page);
};

const getPrice = async (page: Page) => {
  const element = await page.$$('xpath/.//meta[@itemprop="price"]');
  if (element.length) {
    return await getPropertyContent(page, element[0]);
  }
  return 0;
};

const getSku = async (page: Page) => {
  const element = await page.$$('xpath/.//span[@itemprop = "sku"]');
  if (element.length) {
    const sku = await getPropertyContent(page, element[0]);
    return sku.split('-')[0];
  }
  return '';
};

const getVariations = async (page: Page): Promise<ProductVariation[]> => {
  const models = await page.$$('xpath/.//div[contains(@class, "variant--group")]//div[contains(@class, "variant--option")]//input[@type="radio"]');

  if (!models.length) {
    return [];
  }

  const variations = [];

  for (const model of models) {
    const [
      ordernumber,
      title,
      max,
      ean,
      upc,
      price
    ] = await Promise.all([
      page.evaluate(x => x.getAttribute('ordernumber'), model),
      page.evaluate(x => x.getAttribute('title'), model),
      page.evaluate(x => x.getAttribute('max'), model),
      page.evaluate(x => x.getAttribute('ean'), model),
      page.evaluate(x => x.getAttribute('upc'), model),
      page.evaluate(x => x.getAttribute('price'), model)
    ]);

    variations.push(new ProductVariation(
      ordernumber ?? '',
      [{ name: 'Model', value: [title ?? ''] }],
      Number(max),
      ean ?? '',
      upc ?? '',
      Number(price)
    ));
  }

  return variations;
};
