import { getProductStock } from '@crawler/actions/get-product-stock';
import { captureSwallowed } from '@crawlers/base';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';

export const fetchStock = async (productUrl: string) => {
  return await getProductStock(productUrl)
    // Add timeout to avoid being detected by rate limit
    .then(res => new Promise<ProductStock>(resolve => setTimeout(resolve, Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000, res.stock)))
    .catch(err => captureSwallowed(err, 'Error fetching stock', {
      tags: { store: 'tradeinn', usecase: 'fetch-stock' },
      extra: { productUrl }
    }));
};
