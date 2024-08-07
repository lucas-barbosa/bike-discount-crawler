import { runAndDispose } from '@crawlers/base/dist/crawler/utils';
import { ProductTranslation } from '@crawlers/base/dist/types/ProductTranslation';
import { navigate } from '@crawler/utils/navigate';

import { getDescription, getTitle } from './get-product';
import { getProductStock } from './get-product-stock';
import { CRAWLER_ID } from '@infrastructure/utils';

export const getTranslation = async (productUrl: string, language: string): Promise<ProductTranslation> => {
  const { productJson, stock } = await getProductStock(productUrl);
  const { page, browser } = await navigate(productUrl, language);

  return runAndDispose(async () => {
    const description = await getDescription(page);

    const translation = new ProductTranslation(
      stock.id,
      stock.sku,
      CRAWLER_ID,
      getTitle(productJson, language),
      description,
      productUrl,
      language
    );

    return translation;
  }, page, browser);
};
