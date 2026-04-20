import { getProduct } from '@crawler/actions/get-product';
import { captureSwallowed } from '@crawlers/base';

export const fetchProduct = async (productUrl: string, categoryUrl: string, language?: string) => {
  return await getProduct(productUrl, categoryUrl, language)
    .catch(err => captureSwallowed(err, 'Error fetching product', {
      tags: { store: 'barrabes', usecase: 'fetch-product' },
      extra: { productUrl, categoryUrl, language }
    }));
};
