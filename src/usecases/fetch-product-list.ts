import { listProducts } from '@crawler/actions/list-products';

export const fetchProductList = async (categoryUrl: string, page: number = 1) => {
  return await listProducts(categoryUrl, page);
};
