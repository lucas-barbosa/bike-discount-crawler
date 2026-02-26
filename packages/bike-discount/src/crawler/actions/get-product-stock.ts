import { type Page } from 'puppeteer';
import { ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { getTextNode } from '@crawler/utils/crawler';
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
    stock.url = productUrl;

    if (dispose) await disposeCrawler(page, browser);
    return {
      stock,
      page,
      browser
    };
  }, page, browser);
};

interface VariantSibling {
  id: string
  optionIds: string[]
  available: boolean
  availableStock: number
  manufacturerNumber: string
  ean: string | null
  calculatedPrice: { unitPrice: number }
  customFields: {
    migration_Shopware5_product_upc?: string | null
    migration_Shopware5_product_size?: string | null
  }
}

interface VariantData {
  siblings: VariantSibling[]
  currentVariantId: string
  parentId: string
  buyableStatus: Record<string, boolean>
  configuratorSettings: Array<{
    id: string
    options: Array<{ id: string, name: string }>
  }>
}

const getVariantData = async (page: Page): Promise<VariantData | null> => {
  const el = await page.$('[data-nele-variant-data]');
  if (!el) return null;
  const raw = await page.evaluate(e => e.getAttribute('data-nele-variant-data'), el);
  if (!raw) return null;
  try { return JSON.parse(raw) as VariantData; } catch { return null; }
};

const getAvailability = async (page: Page) => {
  const data = await getVariantData(page);
  if (data) {
    const currentId = data.currentVariantId;
    const buyable = data.buyableStatus?.[currentId];
    if (buyable !== undefined) return buyable ? 'instock' : 'outofstock';
  }
  // fallback: check for in-stock color indicator
  const el = await page.$('xpath/.//span[contains(@class, "nele-product-detail-info-current-stock") and contains(@class, "--color-1")]');
  return el ? 'instock' : 'outofstock';
};

export const getId = async (page: Page) => {
  const el = await page.$('[data-nele-parent-id]');
  if (el) {
    const id = await page.evaluate(e => e.getAttribute('data-nele-parent-id'), el);
    if (id) return id;
  }
  return getSku(page);
};

const getPrice = async (page: Page) => {
  const element = await page.$$('xpath/.//meta[@property="product:price:amount"]');
  if (element.length) {
    const content = await page.evaluate(x => x.getAttribute('content'), element[0]);
    if (content) return content;
  }
  return 0;
};

export const getSku = async (page: Page) => {
  const element = await page.$$('xpath/.//span[contains(@class, "product-detail-ordernumber") and not(contains(@class, "product-detail-ordernumber-label"))]');
  if (element.length) {
    const sku = (await getTextNode(page, element[0])).trim();
    return sku.split('-')[0];
  }
  return '';
};

const getVariations = async (page: Page): Promise<ProductVariation[]> => {
  const data = await getVariantData(page);
  if (!data?.siblings?.length) return [];

  // Build a map from optionId → option name
  const optionNameMap = new Map<string, string>();
  for (const group of data.configuratorSettings ?? []) {
    for (const option of group.options ?? []) {
      optionNameMap.set(option.id, option.name);
    }
  }

  return data.siblings.map(sibling => {
    const title = sibling.optionIds.map(id => optionNameMap.get(id) ?? id).join(' / ');
    return new ProductVariation(
      sibling.manufacturerNumber ?? '',
      [{ name: 'Model', value: [title] }],
      sibling.availableStock ?? 0,
      sibling.ean ?? '',
      sibling.customFields?.migration_Shopware5_product_upc ?? '',
      sibling.calculatedPrice?.unitPrice ?? 0
    );
  });
};
