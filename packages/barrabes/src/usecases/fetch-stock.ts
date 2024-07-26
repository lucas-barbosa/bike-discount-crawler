import { getProductStock } from '@crawler/actions/get-product-stock';

export const fetchStock = async (productUrl: string, isPro?: boolean) => {
  return await getProductStock(productUrl, true, 'es')
    .then(res => {
      if (isPro) {
        res.stock.metadata.isPro = isPro;
      }
      return res.stock;
    })
    .catch(err => {
      console.warn(err);
      return null;
    });
};
