import { getProduct } from '@crawler/actions/get-product';
import { logger } from '@crawlers/base';

export const fetchProduct = async (productUrl: string, categoryUrl: string, language?: string) => {
  return await getProduct(productUrl, categoryUrl, language)
    .catch(err => {
      logger.warn({ err }, 'Error fetching product');
      return null;
    });
};
