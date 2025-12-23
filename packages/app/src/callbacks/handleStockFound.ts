import { type StockFoundCallback } from '@crawlers/bike-discount/dist/queue/stock';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { logger } from '@crawlers/base';
import { enqueueStock } from '#queue/stock';
import { hasStockChanged } from '#infrastructure/stock-cache';

export const handleStockFound: StockFoundCallback = async (stock: ProductStock) => {
  const hasChanged = await hasStockChanged(stock);
  if (hasChanged) {
    logger.info({ productId: stock.id }, 'Enqueue stock');
    await enqueueStock(stock);
  } else {
    logger.debug({ productId: stock.id }, 'Not enqueue stock');
  }
};
