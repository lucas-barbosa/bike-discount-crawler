import { type OldStockFoundCallback } from '@crawlers/bike-discount/src/queue/old-stock';
import { type ProductStock } from '@crawlers/bike-discount/dist/types/ProductStock';
import { enqueueOldStock } from '#queue/old-stock';

export const handleOldStockFound: OldStockFoundCallback = async (stock: ProductStock[]) => {
  console.log('Enqueue old stock:');
  await enqueueOldStock(stock);
};
