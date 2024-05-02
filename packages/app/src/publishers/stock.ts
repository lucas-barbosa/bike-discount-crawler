import { type ProductStock } from '@crawlers/bike-discount/src/types/ProductStock';
import { publish } from './base';

export const publishStockChanges = async (stock: ProductStock) => {
  await publish('stock', stock);
};
