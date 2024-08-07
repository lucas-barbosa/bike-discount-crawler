import { getProduct } from '@crawler/actions/get-product';

export const fetchProduct = async (productUrl: string, categoryUrl: string, language?: string) => {
  return await getProduct(productUrl, categoryUrl, language)
    .catch(err => {
      console.warn(err);
      return null;
    });
};
