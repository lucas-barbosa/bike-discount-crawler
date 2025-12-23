import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { logger } from '@crawlers/base';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { type OldProductRequest } from '@crawler/actions/get-old-product-stock';
import { fetchOldStocks } from '@usecases/fetch-old-stocks';

export interface OldStockResult { id: string, items: ProductStock[] }
export type OldStockFoundCallback = (stock: OldStockResult) => Promise<any>;

interface OldStockQueueItem {
  url: string
  variations: OldProductRequest[]
};

const QUEUE_NAME = 'bike_discount.old_product_stock';

let queue: Queue;
export const oldStockQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const oldStockWorker = (onOldStockFound: OldStockFoundCallback) => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<OldStockQueueItem>) => {
    logger.info({ url: data.url }, 'STARTED loading old stock');
    const result = await fetchOldStocks(data.url, data.variations);
    if (result) {
      logger.debug(result, 'Stocks found');
      await onOldStockFound(result);
    }
    logger.info({ url: data.url }, 'FINISHED loading old stock');
  });
  return worker;
};

export const enqueueOldStock = async (productUrl: string, variations: OldProductRequest[]) => {
  oldStockQueue();
  await queue.add(`old-stock:${productUrl}`, {
    url: productUrl,
    variations
  }, {
    ...removeOptions
  }).catch(err => { logger.error({ err }, 'Failed to enqueue old-stock'); });
};

export const startOldStockQueue = (onStocksFound: OldStockFoundCallback) => {
  oldStockQueue();
  oldStockWorker(onStocksFound);
};
