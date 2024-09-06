import { type Page } from 'puppeteer';
import { ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { getPropertyContent } from '@crawler/utils/crawler';
import { ProductVariation } from '@entities/ProductVariation';
import { navigate } from './navigate';
import { disposeCrawler, disposeOnFail } from '@crawlers/base/dist/crawler/utils';

export const getProductStock = async (productUrl: string, dispose?: boolean, language?: string) => {
  const { page, browser } = await navigate(productUrl, language);

  return disposeOnFail(async () => {
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
      availability,
      variations
    );

    stock.crawlerId = 'BD';

    if (dispose) await disposeCrawler(page, browser);
    return {
      stock,
      page,
      browser
    };
  }, page, browser);
};

const getAvailability = async (page: Page) => {
  const stocks = await page.$$('xpath/.//div[contains(@class, "shipping--info")]/ul/li/text()[contains(translate(.,"abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "IN STOCK")]');
  return stocks.length === 1 ? 'instock' : 'outofstock';
};

export const getId = async (page: Page) => {
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

export const getSku = async (page: Page) => {
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
