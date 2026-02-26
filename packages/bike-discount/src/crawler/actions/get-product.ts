import { type Page } from 'puppeteer';
import { getTextNode, getUrl } from '@crawler/utils/crawler';
import { purifyHTML } from '@crawler/utils/html';
import { Product } from '@entities/Product';
import { getProductStock } from './get-product-stock';
import { getCategoryTree } from '@crawlers/base/dist/infrastructure/categories-tree';
import { runAndDispose } from '@crawlers/base/dist/crawler/utils';

export const getProduct = async (productUrl: string, categoryUrl: string, language?: string): Promise<Product> => {
  const { page, browser, stock } = await getProductStock(productUrl, false, language);

  return runAndDispose(async () => {
    const [
      title,
      attributes,
      brand,
      categories,
      crossSelledProducts,
      description,
      dimension,
      images,
      weight
    ] = await Promise.all([
      getTitle(page),
      getAttributes(page),
      getBrand(page),
      getCategories(categoryUrl),
      getCrossSelledProducts(page),
      getDescription(page),
      getDimension(page),
      getImages(page),
      getWeight(page)
    ]);

    const product = new Product(
      stock.id,
      Number(stock.price),
      title,
      stock.sku,
      productUrl,
      categoryUrl
    );

    product.attributes = attributes;
    product.availability = stock.availability;
    product.brand = brand;
    product.categories = categories;
    product.crossSelledProducts = crossSelledProducts;
    product.description = description;
    product.dimensions = dimension;
    product.images = images;
    product.variations = stock.variations;
    product.weight = weight;
    product.crawlerId = 'BD';

    return product;
  }, page, browser);
};

export const getAttributes = async (page: Page) => {
  const rows = await page.$$('xpath/.//table[contains(@class, "product-detail-properties-table")]//tr[contains(@class, "properties-row")]');

  const result: BikeDiscountAttribute[] = [];

  for (const row of rows) {
    const [labelEl, valueEl] = await Promise.all([
      row.$('xpath/.//th[contains(@class, "properties-label")]'),
      row.$('xpath/.//td[contains(@class, "properties-value")]//span')
    ]);

    if (!labelEl || !valueEl) continue;

    const [labelText, valueText] = await Promise.all([
      getTextNode(page, labelEl),
      getTextNode(page, valueEl)
    ]);

    const name = labelText.endsWith(':') ? labelText.slice(0, -1).trim() : labelText.trim();
    const value = valueText.trim();

    if (!name) continue;

    result.push({
      name,
      value: [value]
    });
  }

  const modelElements = await page.$$('xpath/.//div[contains(@class, "product-detail-configurator-options")]//label[contains(@class, "nele-product-detail-configurator-label")]');
  const promises = modelElements.map(async (element) => (await getTextNode(page, element)).trim());
  const models = (await Promise.all(promises)).filter(x => !!x);

  if (models.length) {
    result.push({
      name: 'Model',
      value: models,
      variable: true
    });
  }

  return result;
};

const getBrand = async (page: Page) => {
  const element = await page.$$('xpath/.//span[contains(@class, "product-detail-manufacturer-text")]');
  if (element.length) {
    return (await getTextNode(page, element[0])).trim();
  }
  return '';
};

const getCategories = async (url: string) => {
  if (url) {
    const categoryTree = await getCategoryTree('BD', url);
    if (categoryTree && Array.isArray(categoryTree)) return categoryTree;
  }
  return [];
};

const getCrossSelledProducts = async (page: Page) => {
  const elements = await page.$$('xpath/.//div[contains(@class, "cms-element-cross-selling")]//a[contains(@class, "product-name")]');
  return Promise.all(elements.map(x => getUrl(page, x)));
};

export const getDescription = async (page: Page) => {
  const element = await page.$$('xpath/.//div[@id="description-tab-pane"]//div[contains(@class,"product-detail-description-text")]');
  if (!element.length) return '';
  const content = await page.evaluate(x => x.innerHTML, element[0]);
  return purifyHTML(content);
};

const getDimension = async (page: Page) => {
  const regex = /(\d+)\s*x\s*(\d+)\s*x\s*(\d+)\s*(\S+)/;
  const result = {
    length: '',
    width: '',
    height: '',
    unit: ''
  };

  // Look for dimension/size/folded dimension values in the properties table
  const rows = await page.$$('xpath/.//table[contains(@class, "product-detail-properties-table")]//tr[contains(@class, "properties-row")]');

  for (const row of rows) {
    const labelEl = await row.$('xpath/.//th[contains(@class, "properties-label")]');
    if (!labelEl) continue;

    const labelText = (await getTextNode(page, labelEl)).toLowerCase();
    const isDimension = labelText.includes('dimension') || labelText.includes('size') || labelText.includes('folded');
    if (!isDimension) continue;

    const valueEl = await row.$('xpath/.//td[contains(@class, "properties-value")]//span');
    if (!valueEl) continue;

    const text = await getTextNode(page, valueEl);
    const matches = text.match(regex);
    if (matches) {
      result.length = matches[1];
      result.width = matches[2];
      result.height = matches[3];
      result.unit = matches[4];
      break;
    }
  }

  return result;
};

const getImages = async (page: Page) => {
  const elements = await page.$$('xpath/.//div[contains(@class, "gallery-slider-item-container") and not(contains(@class, "tns-slide-cloned"))]//img[contains(@class, "gallery-slider-image")]');
  const promises = elements.map(async (element) => (await page.evaluate(x => x.getAttribute('data-full-image'), element))?.trim() ?? '');
  return (await Promise.all(promises)).filter(x => !!x);
};

export const getTitle = async (page: Page) => {
  const element = await page.$$('xpath/.//h1[contains(@class, "product-detail-name")]');
  if (element.length) {
    // Get text nodes only, excluding the manufacturer span
    const text = await page.evaluate(el => {
      return Array.from(el.childNodes)
        .filter(node => node.nodeType === Node.TEXT_NODE)
        .map(node => node.textContent ?? '')
        .join('')
        .trim();
    }, element[0]);
    return text;
  }
  return '';
};

const getWeight = async (page: Page) => {
  const element = await page.$$('xpath/.//span[contains(@class, "delivery-plugin")]');

  if (element.length) {
    const raw = await page.evaluate(x => x.getAttribute('data-deliverycostsweight'), element[0]);
    if (raw) {
      return {
        value: Number(raw),
        unit: 'kg'
      };
    }
  }

  return {
    value: 0,
    unit: 'kg'
  };
};
