import { getProductStock } from '@crawler/actions/get-product-stock';
import { logger } from '@crawlers/base';

export const fetchStock = async (productUrl: string, isPro?: boolean) => {
  return await getProductStock(productUrl, true, 'es')
    .then(res => {
      if (isPro) {
        res.stock.metadata.isPro = isPro;
      }
      return res.stock;
    })
    .catch(err => {
      logger.warn({ err }, 'Error fetching stock');
      return null;
    });
};
