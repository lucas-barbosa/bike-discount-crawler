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
  const notFound = { price: 0, availability: 'outofstock' };

  const el = await page.$('[data-nele-variant-data]');
  if (!el) return notFound;

  const raw = await page.evaluate(e => e.getAttribute('data-nele-variant-data'), el);
  if (!raw) return notFound;

  let data: any;
  try { data = JSON.parse(raw); } catch { return notFound; }

  // Build map: option name → sibling id
  const optionToSiblingId = new Map<string, string>();
  for (const group of data.configuratorSettings ?? []) {
    for (const option of group.options ?? []) {
      const name: string = option.name ?? '';
      // each sibling has optionIds; find which sibling includes this option
      for (const sibling of data.siblings ?? []) {
        if ((sibling.optionIds ?? []).includes(option.id)) {
          optionToSiblingId.set(name.toLowerCase(), sibling.id);
        }
      }
    }
  }

  const siblingId = optionToSiblingId.get(attributeName.toLowerCase());
  if (!siblingId) return notFound;

  const sibling = (data.siblings ?? []).find((s: any) => s.id === siblingId);
  if (!sibling) return notFound;

  return {
    price: sibling.calculatedPrice?.unitPrice ?? 0,
    availability: (sibling.availableStock ?? 0) > 0 ? 'instock' : 'outofstock'
  };
};
