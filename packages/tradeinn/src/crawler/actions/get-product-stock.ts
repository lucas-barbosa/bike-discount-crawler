import { type ProductAttribute } from '@crawlers/base/dist/types/ProductAttribute';
import { ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { ProductVariation } from '@crawlers/base/dist/types/ProductVariation';
import { TRADEINN_PRICE_MULTIPLICATOR, COUNTRY_PORTUGAL_ID } from '../../config';
import axios from 'axios';

export const getProductStock = async (productUrl: string, language?: string) => {
  const product = await requestProduct(productUrl);
  const sku = product.id_modelo;
  const variations: ProductVariation[] = product.productes.map((variation: any) => {
    if (!variation.sellers?.length || !Array.isArray(variation.sellers)) {
      return null;
    }

    const offer = variation.sellers.find((seller: any) => seller?.id_seller === 1);
    if (!offer) {
      return null;
    }

    const attributes: ProductAttribute[] = [];
    const size = variation.talla;
    const color = variation.color;
    const availability = getAvailability(offer.plazo_entrega || 0, variation.exist || 0, variation.stock_reservat || 0);
    const price = offer.precios_paises?.find((x: any) => x.id_pais === COUNTRY_PORTUGAL_ID)?.precio || 0;
    const originalPrice = Number(price);
    const calculatedPrice = calculatePrice(originalPrice);

    if (size) {
      attributes.push({ name: 'Tamanho', value: size, variable: true });
    }

    if (color) {
      attributes.push({ name: 'Cor', value: color });
    }

    const result = new ProductVariation(variation.id_producte, attributes, 0, variation.ean, '', calculatedPrice);
    result.availability = availability;
    result.metadata.originalPrice = originalPrice;
    return result;
  }).filter(Boolean);

  const isSingleVariation = variations.length === product.productes?.length && variations.length === 1;
  const price = isSingleVariation ? variations[0].price : calculatePrice(product.precio_win_159);
  const availability = isSingleVariation ? variations[0].availability : 'outofstock';
  const stock = new ProductStock(
    sku,
    price,
    sku,
    availability,
    variations
  );

  stock.crawlerId = 'TT';
  stock.url = productUrl;
  stock.metadata.originalPrice = product.precio_win_159;

  return {
    stock,
    productJson: product
  };
};

const requestProduct = async (productUrl: string) => {
  const splittedUrl = productUrl.split('/');
  const productId = splittedUrl[splittedUrl.length - 2];
  const { data } = await axios.get(`https://dc.tradeinn.com/${productId}`, {
    headers: {
      referer: productUrl,
      origin: 'https://www.tradeinn.com',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    }
  });
  return data._source || {};
};

const calculatePrice = (price: number) => {
  const multiplicator = TRADEINN_PRICE_MULTIPLICATOR || 1;
  const value = Math.round(price * multiplicator * 100) / 100;
  return Math.round(Math.max(value, 0) * 100) / 100;
};

const getAvailability = (deliveryDate: number, tradeInnStock: number, reservedQuantity: number) => {
  const tradeinnQuantity = tradeInnStock - reservedQuantity;

  if (tradeinnQuantity > 0 || deliveryDate === 0 || deliveryDate === 1) {
    return 'instock';
  }
  if (deliveryDate > 1) {
    return 'onbackorder';
  }
  return 'outofstock';
};
