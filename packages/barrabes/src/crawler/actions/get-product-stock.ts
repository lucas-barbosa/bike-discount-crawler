import { type Page } from 'puppeteer';
import { disposeCrawler, getTextNode } from '@crawlers/base/dist/crawler/utils';
import { type ProductAttribute } from '@crawlers/base/dist/types/ProductAttribute';
import { ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { ProductVariation } from '@crawlers/base/dist/types/ProductVariation';
import { navigate } from '@crawler/utils/navigate';
import { BARRABES_PRICE_MULTIPLICATOR } from '../../config';

export const getProductStock = async (productUrl: string, dispose?: boolean, language?: string) => {
  const { page, browser } = await navigate(productUrl, language);

  const [
    price,
    sku,
    attributes
  ] = await Promise.all([
    getPrice(page),
    getSku(page),
    getAttributes(page)
  ]);

  const originalPrice = Number(price);
  const calculatedPrice = calculatePrice(originalPrice);
  const [availability, variations] = await Promise.all([
    getAvailability(page, sku),
    getVariations(page, attributes, sku, calculatedPrice)
  ]);

  const stock = new ProductStock(
    sku,
    calculatedPrice,
    sku,
    availability,
    variations
  );

  stock.crawlerId = 'BB';
  stock.url = productUrl;
  stock.metadata.originalPrice = originalPrice;

  if (dispose) await disposeCrawler(page, browser);
  return {
    stock,
    page,
    browser
  };
};

const calculatePrice = (price: number) => {
  const multiplicator = BARRABES_PRICE_MULTIPLICATOR || 1;
  const value = Math.round(price * multiplicator * 100) / 100;
  return Math.round(Math.max(value, 0) * 100) / 100;
};

const getBarrabesProductObject = async (page: Page) => {
  const scriptContent = await page.evaluate(() => {
    const scriptTags = Array.from(document.querySelectorAll('script'));
    for (const scriptTag of scriptTags) {
      if (scriptTag.textContent?.includes('function CambiarTalla')) {
        return scriptTag.textContent;
      }
    }
    return null;
  });

  if (scriptContent) {
    const lstProdMatch = scriptContent.match(/var lstProd = (\[[\s\S]*?\]);/);
    const lstProd = lstProdMatch ? JSON.parse(lstProdMatch[1]) : null;
    return lstProd;
  }

  return null;
};

const getStockFromBarrabesObject = (productId: string, size: string, barrabesObject: any) => {
  if (!barrabesObject || !Array.isArray(barrabesObject)) return 'outofstock';
  const product = barrabesObject.find(product => product.IdProducto === Number(productId));
  if (product?.LST_VARIEDADES) {
    const variation = size
      ? product.LST_VARIEDADES.find((variation: any) => variation.Talla === size || variation.TallaERP === size)
      : product.LST_VARIEDADES[0];

    if (variation?.LST_STOCK?.length) {
      for (const stock of variation.LST_STOCK) {
        if (stock?.PlazoDesdeCalculado > 5) {
          return 'onbackorder';
        } else if (stock?.PlazoDesdeCalculado > 0) {
          return 'instock';
        }
      }
    }
  }
  return 'outofstock';
};

const getAvailability = async (page: Page, productId: string): Promise<string> => {
  const sizeElements = await page.$$('#listaTallas li');
  if (sizeElements.length) return '';
  const barrabesObject = await getBarrabesProductObject(page);
  return getStockFromBarrabesObject(productId, '', barrabesObject);
};

export const getAttributes = async (page: Page): Promise<ProductAttribute[]> => {
  const attributes: ProductAttribute[] = [];
  const colorVariationElements = await page.$$('#colorSeleccionado:not([hidden])');
  if (colorVariationElements.length) {
    const color = await getTextNode(page, colorVariationElements[0]);
    if (color) {
      attributes.push({
        name: 'Cor',
        value: [color],
        variable: false
      });
    }
  }

  const sizeElements = await page.$$('#listaTallas li');
  if (!sizeElements.length) return attributes;

  const promises = sizeElements.map(async (size) => {
    const labelElement = await size.$('label');
    const label = await getTextNode(page, labelElement!);
    const inputElement = await size.$('input:not(:disabled)');
    return { label, stock: !!inputElement };
  });

  const sizes = await Promise.all(promises);
  return [
    ...attributes, {
      name: 'Tamanho',
      value: sizes.map(size => size.label),
      variable: sizes.length > 0
    }
  ];
};

const sanitizePrice = (rawPrice: string) => {
  const price = Number(rawPrice.split(' ')[0].replaceAll('.', '').replace(',', '.'));
  return isNaN(price) ? 0 : price;
};

const getPrice = async (page: Page) => {
  const oldPrice = await page.$$('#precioOldFP:not(:empty)');
  if (oldPrice.length) {
    const price = await getTextNode(page, oldPrice[0]);
    return sanitizePrice(price);
  }

  const normalPrice = await page.$$('#precioNormalFP:not(:empty)');
  if (normalPrice.length) {
    const price = await getTextNode(page, normalPrice[0]);
    return sanitizePrice(price);
  }

  const salePrice = await page.$$('#precioDescuentoFP:not(:empty)');
  if (salePrice.length) {
    const price = await getTextNode(page, salePrice[0]);
    return sanitizePrice(price);
  }

  return 0;
};

export const getSku = async (page: Page) => {
  const elements = await page.$$('#IdProH');
  if (!elements.length) return '';
  return await page.evaluate(x => x.getAttribute('value'), elements[0]) ?? '';
};

const getVariations = async (page: Page, attributes: ProductAttribute[], sku: string, price: number): Promise<ProductVariation[]> => {
  const sizeAttribute = attributes.find(attribute => attribute.name === 'Tamanho' && attribute.value.length > 0);

  if (!sizeAttribute) {
    return [];
  }

  const variations = [];
  const barrabesObject = await getBarrabesProductObject(page);

  for (const size of sizeAttribute.value) {
    const variationSku = `${sku}-${size}`;
    const variationAttribute = [{ name: sizeAttribute.name, value: [size] }];
    const variationStock = getStockFromBarrabesObject(sku, size, barrabesObject);
    // TODO: find stock in page

    const variation = new ProductVariation(variationSku, variationAttribute, 0, '', '', price);
    variation.availability = variationStock;
    variations.push(variation);
  }

  return variations;
};
