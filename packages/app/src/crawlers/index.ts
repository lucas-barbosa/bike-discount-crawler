import { initQueue as initBikeDiscount } from '@crawlers/bike-discount';
import { handleCategoriesFound } from '#callbacks/handleCategoriesFound';
import { handleProductFound } from '#callbacks/handleProductFound';
import { handleStockFound } from '#callbacks/handleStockFound';

export const initCrawlers = async () => {
  await initBikeDiscount({
    onCategoriesFound: handleCategoriesFound,
    onProductFound: handleProductFound,
    onStockFound: handleStockFound
  });
};
