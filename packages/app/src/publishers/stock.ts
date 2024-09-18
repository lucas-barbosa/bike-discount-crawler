import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { publish } from './base';
import { type OldStockResult } from '@crawlers/bike-discount/src/queue/old-stock';

export const publishStockChanges = async (stock: ProductStock) => {
  return await publish('stock', stock);
};

export const publishOldStockChanges = async (data: OldStockResult) => {
  return await publish('old-stock', data);
};
