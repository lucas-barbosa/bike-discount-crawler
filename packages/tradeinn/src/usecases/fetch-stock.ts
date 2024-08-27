import { getProductStock } from '@crawler/actions/get-product-stock';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';

export const fetchStock = async (productUrl: string) => {
  return await getProductStock(productUrl)
    // Add timeout to avoid being detected by rate limit
    .then(res => new Promise<ProductStock>(resolve => setTimeout(resolve, Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000, res.stock)))
    .catch(err => {
      console.warn(err);
      return null;
    });
};
