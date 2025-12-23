import { type ElementHandle, type Page } from 'puppeteer';

import { getOnClick, getSrc, getTextNode, getUrl, hasClass, runAndDispose } from '@crawlers/base/dist/crawler/utils';
import { type ProductAttribute } from '@crawlers/base/dist/types/ProductAttribute';
import { Product } from '@crawlers/base/dist/types/Product';
import { getCategoryTree } from '@crawlers/base/dist/infrastructure/categories-tree';

import { purifyHTML } from '@crawler/utils/html';
import { addPrefixIfRelative } from '@crawler/utils/url';
import { getAttributes, getProductStock } from './get-product-stock';

export const getProduct = async (productUrl: string, categoryUrl: string, language: string = 'pt'): Promise<Product> => {
  const { page, browser, stock } = await getProductStock(productUrl, false, language);

  return runAndDispose(async () => {
    const features = await getFeatures(page);
    const [
      title,
      brand,
      categories,
      crossSelledProducts,
      description,
      images,
      weight
    ] = await Promise.all([
      getTitle(page),
      getBrand(page),
      getCategories(categoryUrl),
      getCrossSelledProducts(page),
      getDescription(page),
      getImages(page),
      getWeight(features)
    ]);

    const variationAttributes = await getAttributes(page);
    const attributes = [...variationAttributes, ...features].filter(x => !!x);
    const isProCategory = !categoryUrl.includes('barrabes.com/pt/');

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
    product.images = images;
    product.variations = stock.variations;
    product.weight = weight;
    product.crawlerId = 'BB';
    product.metadata.isPro = isProCategory;
    return product;
  }, page, browser);
};

export const getTitle = async (page: Page) => {
  const titleItem = await page.$$('h1.product--header-name');

  if (titleItem.length < 1) {
    return '';
  }

  return getTextNode(page, titleItem[0]);
};

const getBrand = async (page: Page) => {
  const element = await page.$$('.product--header-brand #productLogoText');

  if (element.length < 1) {
    return '';
  }

  return getTextNode(page, element[0]);
};

const getCategories = async (url: string) => {
  if (url) {
    const categoryTree = await getCategoryTree('BB', url);
    if (categoryTree && Array.isArray(categoryTree)) return categoryTree;
  }
  return [];
};

const getCrossSelledProducts = async (page: Page) => {
  const regex = /window\.location\.href\s*=\s*'([^']+)'/;
  const colorVariationElements = await page.$$('ul.variety-color-list li[onclick^="window.location.href"]');

  const colorVariations = await Promise.all(colorVariationElements.map(async (x) => {
    const attribute = await getOnClick(page, x);
    const match = attribute.match(regex);
    return match ? match[1] : '';
  }));

  const recommendedProductElements = await page.$$('#sliderRecommended .card--product .card-product-name a');
  const recommendedProducts = await Promise.all(recommendedProductElements.map((product) => getUrl(page, product)));

  return [
    ...colorVariations,
    ...recommendedProducts
  ].filter(x => !!x)
    .map(url => addPrefixIfRelative(url));
};

export const getDescription = async (page: Page) => {
  const element = await page.$$('.product--features .wysiwyg');
  if (!element.length) return '';
  const content = await page.evaluate(x => x.innerHTML, element[0]);
  return purifyHTML(content);
};

const getFeatures = async (page: Page): Promise<ProductAttribute[]> => {
  const elements = await page.$$('#tab-materiales table th.nombre');
  const features = await Promise.all(
    elements.map(async (element) => {
      const name = await getTextNode(page, element);
      const sibbling = await page.evaluateHandle(el => el.nextElementSibling, element);
      if (!sibbling) {
        return null;
      }
      const value = await getTextNode(page, sibbling as ElementHandle<Element>);
      const isDescription = await hasClass(page, sibbling as ElementHandle<Element>, 'descripcion');

      return { name, value: [isDescription ? value : ''] };
    })
  );
  const filteredFeatures = features.filter(feature => feature !== null);
  return filteredFeatures as any;
};

const getImages = async (page: Page) => {
  const elements = await page.$$('.gallery-image li img');
  return Promise.all(
    elements.map((element) => getSrc(page, element))
  );
};

const getWeight = (features: ProductAttribute[]) => {
  const weightRow = features.find(feature => feature.name.includes('Peso aproximado'));
  if (!weightRow) {
    return {
      value: 0,
      unit: 'kg'
    };
  }

  const regex = /(\d+)([^\d\W]+)/;
  const match = weightRow.value[0].trim().match(regex);

  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];

    return { value, unit };
  }

  return {
    value: 0,
    unit: 'kg'
  };
};
