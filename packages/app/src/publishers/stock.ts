import { type ProductStock } from '@crawlers/bike-discount/src/types/ProductStock';
import { publish } from './base';
import { type OldStockResult } from '@crawlers/bike-discount/src/queue/old-stock';

export const publishStockChanges = async (stock: ProductStock) => {
  await publish('stock', stock);
};

export const publishOldStockChanges = async (data: OldStockResult) => {
  await publish('old-stock', data);
};
