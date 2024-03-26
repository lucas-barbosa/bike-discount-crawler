import { type Page } from 'puppeteer';
import { disposeCrawler, getClasses, getPropertyContent, getTextNode, getUrl, startCrawler } from '@crawler/utils/crawler';
import { purifyHTML } from '@crawler/utils/html';
import { loginIfRequired } from '@middlewares/login-if-required';
import { Product } from 'src/types/Product';
import { ProductVariation } from 'src/types/ProductVariation';

export const getProduct = async (productUrl: string, language?: string): Promise<any> => {
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
    title,
    attributes,
    availability,
    brand,
    crossSelledProducts,
    description,
    dimension,
    id,
    images,
    sku,
    price,
    variations,
    weight
  ] = await Promise.all([
    getTitle(page),
    getAttributes(page),
    getAvailability(page),
    getBrand(page),
    getCrossSelledProducts(page),
    getDescription(page),
    getDimension(page),
    getId(page),
    getImages(page),
    getSku(page),
    getPrice(page),
    getVariations(page),
    getWeight(page)
  ]);

  const product = new Product(
    id,
    Number(price),
    title,
    sku,
    productUrl
  );

  product.attributes = attributes;
  product.availability = availability;
  product.brand = brand;
  product.crossSelledProducts = crossSelledProducts;
  product.description = description;
  product.dimensions = dimension;
  product.images = images;
  product.variations = variations;
  product.weight = weight;

  await disposeCrawler(page, browser);
  return product;
};

const getAttributes = async (page: Page) => {
  const rawAttributes = [];
  const elements = await page.$$('xpath/.//div[contains(@class, "tab-menu--product")]//table[contains(@class, "product--properties-table")]//tr/td');

  for (const element of elements) {
    const [classes, name] = await Promise.all([
      getClasses(page, element),
      getTextNode(page, element)
    ]);

    if (classes.includes('product--properties-label')) {
      rawAttributes.push({
        name: name.endsWith(':') ? name.substring(0, name.length - 1) : name,
        value: ''
      });
    } else if (classes.includes('product--properties-value')) {
      const lastIndex = rawAttributes.length - 1;
      rawAttributes[lastIndex].value = name;
    }
  }

  const result: BikeDiscountAttribute[] = [];

  for (const attribute of rawAttributes) {
    if (!attribute.name) continue;
    result.push({
      name: attribute.name,
      value: [attribute.value]
    });
  }

  const modelElements = await page.$$('xpath/.//div[contains(@class, "variant--group")]//div[contains(@class, "variant--option")]//input[@type="radio"]');
  const promises = modelElements.map(async (element) => (await page.evaluate(x => x.getAttribute('title'), element))?.trim() ?? '');
  const models = (await Promise.all(promises)).filter(x => !!x);

  if (models) {
    result.push({
      name: 'Model',
      value: models,
      variable: true
    });
  }

  return result;
};

const getAvailability = async (page: Page) => {
  const stocks = await page.$$('xpath/.//div[contains(@class, "shipping--info")]/ul/li/text()[contains(translate(.,"abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ"), "IN STOCK")]');
  return stocks.length === 1 ? 'instock' : 'outofstock';
};

const getBrand = async (page: Page) => {
  const element = await page.$$('xpath/.//meta[@itemprop = "brand"]');
  if (element.length) {
    return (await getPropertyContent(page, element[0]));
  }
  return '';
};

const getCrossSelledProducts = async (page: Page) => {
  const elements = await page.$$('xpath/.//div[contains(@class, "tab-menu--cross-selling")]//div[contains(@class, "product--info")]/a[contains(@class, "product--title")]');
  return Promise.all(elements.map(x => getUrl(page, x)));
};

const getDescription = async (page: Page) => {
  const element = await page.$$('xpath/.//div[contains(@class,"tab-menu--product")]//div[contains(@class,"content--description")]');
  if (!element.length) return '';
  const content = await page.evaluate(x => x.innerHTML, element[0]);
  return purifyHTML(content);
};

const getDimension = async (page: Page) => {
  const foldedDimension = await page.$$('xpath/.//div[contains(@class,"tab-menu--product")]//li[strong[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "folded dimension") or contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "folded size")]]');
  const regex = /(\d+)\s*x\s*(\d+)\s*x\s*(\d+)\s*(\S+)/;

  if (foldedDimension.length > 0) {
    const text = await getTextNode(page, foldedDimension[0]);
    const matches = text.match(regex);
    if (matches) {
      return {
        length: matches[1],
        width: matches[2],
        height: matches[3],
        unit: matches[4]
      };
    }
  }

  const dimensions = await page.$$('xpath/.//div[contains(@class,"tab-menu--product")]//li[strong[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "dimension:") or contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "size:")]]');
  const result = {
    length: '',
    width: '',
    height: '',
    unit: ''
  };

  for (const dimension of dimensions) {
    const text = await getTextNode(page, dimension);
    const matches = text.match(regex);

    if (matches) {
      result.length = matches[1];
      result.width = matches[2];
      result.height = matches[3];
      result.unit = matches[4];
      break;
    };
  }

  return result;
};

const getId = async (page: Page) => {
  const element = await page.$$('xpath/.//meta[@itemprop = "productID"]');
  if (element.length) {
    return await getPropertyContent(page, element[0]);
  }
  return getSku(page);
};

const getImages = async (page: Page) => {
  const elements = await page.$$("xpath/.//div[contains(@class, 'product--image-container')]//div[contains(@class, 'image-slider--container')]//div[contains(@class, 'image--box')]//span[contains(@class, 'image--element')]");
  const promises = elements.map(async (element) => (await page.evaluate(x => x.getAttribute('data-img-original'), element))?.trim() ?? '');
  return Promise.all(promises);
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

const getTitle = async (page: Page) => {
  const element = await page.$$('xpath/.//h1[@class="product--title"]');
  if (element.length) {
    return (await getTextNode(page, element[0])).trim();
  }
  return '';
};

const getWeight = async (page: Page) => {
  const element = await page.$$('xpath/.//meta[@itemprop="weight"]');

  if (element.length) {
    return {
      value: 0,
      unit: 'kg'
    };
  }

  const weight = (await getTextNode(page, element[0])).split(' ');

  return {
    value: Number(weight[0]),
    unit: weight.length > 1 ? weight[1] : 'kg'
  };
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
