import { type OldStockResult, type OldStockFoundCallback } from '@crawlers/bike-discount/src/queue/old-stock';
import { enqueueOldStock } from '#queue/old-stock';

export const handleOldStockFound: OldStockFoundCallback = async (data: OldStockResult) => {
  console.log('Enqueue old stock:');
  await enqueueOldStock(data);
};
