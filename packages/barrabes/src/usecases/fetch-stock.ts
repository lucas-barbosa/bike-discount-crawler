import { getProductStock } from '@crawler/actions/get-product-stock';

export const fetchStock = async (productUrl: string) => {
  return await getProductStock(productUrl, true, 'es')
    .then(res => res.stock)
    .catch(err => {
      console.warn(err);
      return null;
    });
};
