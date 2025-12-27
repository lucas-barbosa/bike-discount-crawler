import { getProductStock } from '@crawler/actions/get-product-stock';
import { logger } from '@crawlers/base';

export const fetchStock = async (productUrl: string) => {
  return await getProductStock(productUrl, true)
    .then(res => res.stock)
    .catch(err => {
      logger.warn({ err }, 'Error fetching stock');
      return null;
    });
};
