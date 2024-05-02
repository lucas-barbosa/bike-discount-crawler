import { initQueue as initBikeDiscount } from '@crawlers/bike-discount';
import { handleProductFound } from '#callbacks/handleProductFound';
import { handleStockFound } from '#callbacks/handleStockFound';

export const initCrawlers = async () => {
  await initBikeDiscount({
    onProductFound: handleProductFound,
    onStockFound: handleStockFound
  });
};
