import { listProducts } from '@crawler/actions/list-products';
import { logger } from '@crawlers/base';

export const fetchProductList = async (categoryUrl: string, page: number = 1) => {
  return await listProducts(categoryUrl, page)
    .catch(err => {
      logger.warn({ err }, 'Error fetching product list');
      return null;
    });
};
