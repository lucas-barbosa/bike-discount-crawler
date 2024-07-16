import { disposeCrawler, runAndDispose } from '@crawlers/base/dist/crawler/utils';
import { ProductTranslation } from '@crawlers/base/dist/types/ProductTranslation';
import { navigate } from '@crawler/utils/navigate';

import { getDescription, getTitle } from './get-product';
import { getSku } from './get-product-stock';

export const getTranslation = async (productUrl: string, language: string): Promise<ProductTranslation> => {
  const { page, browser } = await navigate(productUrl, language);

  return runAndDispose(async () => {
    const [
      sku,
      title,
      description
    ] = await Promise.all([
      getSku(page),
      getTitle(page),
      getDescription(page)
    ]);
  
    const translation = new ProductTranslation(
      sku,
      sku,
      'BB',
      title,
      description,
      productUrl,
      language
    );
  
    return translation;
  }, page, browser);
};
