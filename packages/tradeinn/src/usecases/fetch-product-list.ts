// import { listProducts } from '@crawler/actions/list-products';

export const fetchProductList = async (categoryUrl: string, page: number = 1) => {
  return {
    productLinks: [],
    hasNextPage: false
  };
  //  await listProducts(categoryUrl, page)
  //   .catch(err => {
  //     console.warn(err);
  //     return null;
  //   });
};
