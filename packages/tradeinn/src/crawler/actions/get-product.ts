// import { type ElementHandle, type Page } from 'puppeteer';
import { getSrc, getTextNode, getUrl, runAndDispose } from '@crawlers/base/dist/crawler/utils';
import { getCategoryTree } from '@crawlers/base/dist/infrastructure/categories-tree';
import { Product } from '@crawlers/base/dist/types/Product';

import { navigate } from '@crawler/utils/navigate';
import { getProductStock } from './get-product-stock';
import { type Page } from 'puppeteer';
import { purifyHTML } from '@crawler/utils/html';
import { type ProductAttribute } from '@crawlers/base/dist/types/ProductAttribute';

export const getProduct = async (productUrl: string, categoryUrl: string, language: string = 'pt'): Promise<Product> => {
  const { stock, productJson } = await getProductStock(productUrl);
  const { page, browser } = await navigate(productUrl, language);

  return runAndDispose(async () => {
    const [
      attributes,
      categories,
      crossSelledProducts,
      description,
      images
    ] = await Promise.all([
      getAttributes(productJson, page),
      getCategories(categoryUrl),
      getCrossSelledProducts(page),
      getDescription(page),
      getImages(page)
    ]);

    const product = new Product(
      stock.id,
      Number(stock.price),
      getTitle(productJson, language),
      stock.sku,
      productUrl,
      categoryUrl
    );

    product.crawlerId = 'TT';
    product.attributes = attributes;
    product.availability = stock.availability;
    product.brand = productJson.marca?.trim();
    product.categories = categories;
    product.crossSelledProducts = crossSelledProducts;
    product.description = description;
    product.images = images;
    product.variations = stock.variations;
    product.weight = getWeight(productJson);
    return product;
  }, page, browser);
};

const getAttributes = async (productJson: any, page: Page): Promise<ProductAttribute[]> => {
  const colorAttributes = new Set<string>();
  const sizeAttributes = new Set<string>();

  if (productJson?.productes) {
    productJson.productes.forEach((variation: any) => {
      if (variation.color) colorAttributes.add(variation.color);
      if (variation.talla) sizeAttributes.add(variation.talla);
    });
  }

  const productAttributes = [];

  const elements = await page.$$('#js-detalle-atributos .detalle-atributos__tabla');

  for (let i = 0; i < elements.length; i += 2) {
    const name = await getTextNode(page, elements[i]);
    const value = await getTextNode(page, elements[i + 1]);
    productAttributes.push({ name, value: [value], variable: false });
  }

  return [
    ...(colorAttributes.size > 0 ? [{ name: 'Cor', value: [...colorAttributes], variable: colorAttributes.size > 1 }] : []),
    ...(sizeAttributes.size > 0 ? [{ name: 'Tamanho', value: [...sizeAttributes], variable: sizeAttributes.size > 1 }] : []),
    ...productAttributes
  ];
};

export const getTitle = (productJson: any, language: string) => {
  const title = {
    pt: productJson.model.por || productJson.model.eng,
    es: productJson.model.spa || productJson.model.eng,
    en: productJson.model.eng
  } as any;

  return `${productJson.marca} ${title[language] || ''}`.trim();
};

const getCategories = async (url: string) => {
  if (url) {
    const categoryTree = await getCategoryTree('TT', url);
    if (categoryTree && Array.isArray(categoryTree)) return categoryTree;
  }
  return [];
};

const getCrossSelledProducts = async (page: Page) => {
  const relatedProducts = await page.waitForSelector('#js-product-listing-container-detalleSimilar li a.js-href_list_products', {
    timeout: 10000
  })
    .then(() => page.$$('#js-product-listing-container-detalleSimilar li a.js-href_list_products'))
    .catch(() => []);

  return Promise.all(relatedProducts.map(async (x) => {
    return getUrl(page, x);
  }))
    .then(x => x.slice(0, 10))
    .then(x => x.map(x => `https://www.tradeinn.com${x}`));
};

export const getDescription = async (page: Page) => {
  const element = await page.$$('#desc');
  if (!element.length) return '';
  const content = await page.evaluate(x => x.innerHTML, element[0]);
  return purifyHTML(content);
};

const getImages = async (page: Page) => {
  const elements = await page.$$('#swiper-touch .swiper-slide p img');
  return Promise.all(
    elements.map((element) => getSrc(page, element))
  );
};

const getWeight = (productJson: any) => {
  const weightRow = productJson.peso;
  if (!weightRow) {
    return {
      value: 0,
      unit: 'kg'
    };
  }

  return {
    value: Number(weightRow),
    unit: 'kg'
  };
};
