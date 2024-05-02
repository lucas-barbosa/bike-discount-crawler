import { type StockFoundCallback } from '@crawlers/bike-discount/dist/queue/stock';
import { type ProductStock } from '@crawlers/bike-discount/dist/types/ProductStock';
import { enqueueStock } from '#queue/stock';

export const handleStockFound: StockFoundCallback = async (stock: ProductStock) => {
  console.log('Enqueue stock:');
  await enqueueStock(stock);
};
