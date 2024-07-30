// This method should be used to crawler stock of Manually Created Products (plugin v1)

import { type Page } from 'puppeteer';
import { ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { navigate } from './navigate';
import { runAndDispose } from '@crawlers/base/dist/crawler/utils';

export interface OldProductRequest {
  productId: string
  variationName: string
}

export const getOldProductStock = async (productUrl: string, products: OldProductRequest[]) => {
  const { page, browser } = await navigate(productUrl, 'en');

  const result = await runAndDispose(() => {
    return Promise.all(products.map(async (product) => {
      const attributeName = product.variationName.split('"')[0].replace(/\\(.)/mg, '$1');

      const { price, availability } = await getVariationByAttribute(page, attributeName);

      const stock = new ProductStock(
        product.productId,
        Number(price),
        'LB_CRAWLERS_OLD_PRODUCT',
        availability
      );
      stock.crawlerId = 'BD';

      return stock;
    }));
  }, page, browser);

  return { stocks: result };
};

const getVariationByAttribute = async (page: Page, attributeName: string) => {
  const elements = await page.$$(`xpath/.//input[@title="${attributeName}"]`);
  if (!elements || elements.length !== 1) {
    return {
      price: 0,
      availability: 'outofstock'
    };
  }
  const price = (await page.evaluate(x => x.getAttribute('price'), elements[0]))?.trim() ?? 0;
  const stock = (await page.evaluate(x => x.getAttribute('max'), elements[0]))?.trim() ?? 0;
  return {
    price,
    availability: Number(stock) > 0 ? 'instock' : 'outofstock'
  };
};
