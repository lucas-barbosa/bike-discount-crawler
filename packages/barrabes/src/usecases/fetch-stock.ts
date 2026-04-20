import { getProductStock } from '@crawler/actions/get-product-stock';
import { captureSwallowed } from '@crawlers/base';

export const fetchStock = async (productUrl: string, isPro?: boolean) => {
  return await getProductStock(productUrl, true, 'es')
    .then(res => {
      if (isPro) {
        res.stock.metadata.isPro = isPro;
      }
      return res.stock;
    })
    .catch(err => captureSwallowed(err, 'Error fetching stock', {
      tags: { store: 'barrabes', usecase: 'fetch-stock' },
      extra: { productUrl, isPro }
    }));
};
