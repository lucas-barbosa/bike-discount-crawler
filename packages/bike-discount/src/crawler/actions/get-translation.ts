import { disposeCrawler } from '@crawler/utils/crawler';
import { Translation } from '@entities/Translation';
import { getAttributes, getDescription, getTitle } from './get-product';
import { navigate } from './navigate';
import { getId, getSku } from './get-product-stock';

export const getTranslation = async (productUrl: string, language: string): Promise<Translation> => {
  const { page, browser } = await navigate(productUrl, language, false);

  const [
    id,
    sku,
    title,
    attributes,
    description
  ] = await Promise.all([
    getId(page),
    getSku(page),
    getTitle(page),
    getAttributes(page),
    getDescription(page)
  ]);

  const translation = new Translation(
    id,
    sku,
    'BD',
    title,
    description,
    productUrl,
    language
  );

  translation.attributes = attributes;

  await disposeCrawler(page, browser);
  return translation;
};
