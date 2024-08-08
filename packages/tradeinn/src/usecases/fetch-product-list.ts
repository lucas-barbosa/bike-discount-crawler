import { listProducts } from '@crawler/actions/list-products';

export const fetchProductList = async (categoryUrl: string, page: number = 1) => {
  const params = getParamsFromUrl(categoryUrl);

  if (!params) {
    return null;
  }

  return listProducts(params.parentId, params.categoryId, categoryUrl, page)
    .catch(err => {
      console.warn(err);
      return null;
    });
};

const getParamsFromUrl = (url: string) => {
  const urlObj = new URL(url);
  const parentId = urlObj.searchParams.get('parentId');
  const categoryId = urlObj.searchParams.get('categoryId');

  if (parentId === null || categoryId === null) {
    return null;
  }

  return { parentId, categoryId };
};
