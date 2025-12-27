import { type OldProductRequest, getOldProductStock } from '@crawler/actions/get-old-product-stock';
import { logger } from '@crawlers/base';

export const fetchOldStocks = async (productUrl: string, variations: OldProductRequest[]) => {
  return await getOldProductStock(productUrl, variations)
    .then(res => ({ id: 'BD', items: res.stocks }))
    .catch(err => {
      logger.error({ err }, 'Error fetching old stocks');
      return null;
    });
};
