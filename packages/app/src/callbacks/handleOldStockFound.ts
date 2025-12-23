import { type OldStockResult, type OldStockFoundCallback } from '@crawlers/bike-discount/src/queue/old-stock';
import { logger } from '@crawlers/base';
import { enqueueOldStock } from '#queue/old-stock';

export const handleOldStockFound: OldStockFoundCallback = async (data: OldStockResult) => {
  logger.info('Enqueue old stock');
  await enqueueOldStock(data);
};
