import { initQueue as initBikeDiscount } from '@crawlers/bike-discount';
import { handleCategoriesFound } from '#callbacks/handleCategoriesFound';
import { handleProductFound } from '#callbacks/handleProductFound';
import { handleStockFound } from '#callbacks/handleStockFound';
import { handleTranslationFound } from '#callbacks/handleTranslationFound';
import { handleOldStockFound } from '#callbacks/handleOldStockFound';

export const initCrawlers = async () => {
  await initBikeDiscount({
    onCategoriesFound: handleCategoriesFound,
    onProductFound: handleProductFound,
    onStockFound: handleStockFound,
    onOldStockFound: handleOldStockFound,
    onTranslationFound: handleTranslationFound
  });
};
