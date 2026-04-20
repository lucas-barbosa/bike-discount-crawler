import { listProducts } from '@crawler/actions/list-products';
import { captureSwallowed } from '@crawlers/base';

export const fetchProductList = async (categoryUrl: string, page: number = 1) => {
  return await listProducts(categoryUrl, page)
    .catch(err => captureSwallowed(err, 'Error fetching product list', {
      tags: { store: 'barrabes', usecase: 'fetch-product-list' },
      extra: { categoryUrl, page }
    }));
};
