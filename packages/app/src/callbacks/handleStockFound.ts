import { type StockFoundCallback } from '@crawlers/bike-discount/dist/queue/stock';
import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { enqueueStock } from '#queue/stock';
import { hasStockChanged } from '#infrastructure/stock-cache';

export const handleStockFound: StockFoundCallback = async (stock: ProductStock) => {
  const hasChanged = await hasStockChanged(stock);
  if (hasChanged) {
    console.log('Enqueue stock');
    await enqueueStock(stock);
  } else {
    console.log('Not enqueue stock');
  }
};
