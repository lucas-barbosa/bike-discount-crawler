import { initQueue as initBarrabes } from '@crawlers/barrabes';
import { initQueue as initBikeDiscount } from '@crawlers/bike-discount';
import { initQueue as initTradeinn } from '@crawlers/tradeinn';
import { handleCategoriesFound } from '#callbacks/handleCategoriesFound';
import { handleProductFound } from '#callbacks/handleProductFound';
import { handleStockFound } from '#callbacks/handleStockFound';
import { handleTranslationFound } from '#callbacks/handleTranslationFound';
import { handleOldStockFound } from '#callbacks/handleOldStockFound';
import { handleProductImageFound } from '#callbacks/handleProductImageFound';
import { handleAttributesFound } from '#callbacks/handleAttributesFound';
import { registerProduct } from '../infrastructure/product-registry';

export const initCrawlers = async () => {
  await initBarrabes({
    onCategoriesFound: handleCategoriesFound,
    onProductFound: handleProductFound,
    onStockFound: handleStockFound,
    onTranslationFound: handleTranslationFound,
    onProductImageFound: handleProductImageFound,
    onAttributesFound: handleAttributesFound,
    registerProduct: (url: string, metadata?: any) => registerProduct('barrabes', url, 'stock', metadata)
  });

  await initBikeDiscount({
    onCategoriesFound: handleCategoriesFound,
    onProductFound: handleProductFound,
    onStockFound: handleStockFound,
    onOldStockFound: handleOldStockFound,
    onTranslationFound: handleTranslationFound,
    registerProduct: (url: string, metadata?: any) => registerProduct('bike-discount', url, 'stock', metadata)
  });

  await initTradeinn({
    onCategoriesFound: handleCategoriesFound,
    onProductFound: handleProductFound,
    onStockFound: handleStockFound,
    onTranslationFound: handleTranslationFound,
    onProductImageFound: handleProductImageFound,
    onAttributesFound: handleAttributesFound,
    registerProduct: (url: string, metadata?: any) => registerProduct('tradeinn', url, 'stock', metadata)
  });
};
