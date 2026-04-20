import { getProductStock } from '@crawler/actions/get-product-stock';
import { captureSwallowed } from '@crawlers/base';

export const fetchStock = async (productUrl: string) => {
  return await getProductStock(productUrl, true)
    .then(res => res.stock)
    .catch(err => captureSwallowed(err, 'Error fetching stock', {
      tags: { store: 'bike-discount', usecase: 'fetch-stock' },
      extra: { productUrl }
    }));
};
