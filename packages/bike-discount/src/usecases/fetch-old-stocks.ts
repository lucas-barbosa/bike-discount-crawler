import { type OldProductRequest, getOldProductStock } from '@crawler/actions/get-old-product-stock';

export const fetchOldStocks = async (productUrl: string, variations: OldProductRequest[]) => {
  return await getOldProductStock(productUrl, variations)
    .then(res => ({ id: 'BD', items: res.stocks }))
    .catch(err => {
      console.warn(err);
      return null;
    });
};
