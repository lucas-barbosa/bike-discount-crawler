import { listProducts } from '@crawler/actions/list-products';

export const fetchProductList = async (categoryUrl: string, page: 1) => {
  const result = await listProducts(categoryUrl, page);
  console.log(result);
  // TODO: enqueue each product
  // TODO: enqueue some category with next page
};
