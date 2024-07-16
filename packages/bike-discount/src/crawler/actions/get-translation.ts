import { Translation } from '@entities/Translation';
import { getAttributes, getDescription, getTitle } from './get-product';
import { navigate } from './navigate';
import { getId, getSku } from './get-product-stock';
import { runAndDispose } from '@crawlers/base/dist/crawler/utils';

export const getTranslation = async (productUrl: string, language: string): Promise<Translation> => {
  const { page, browser } = await navigate(productUrl, language, false);

  return runAndDispose(async () => {
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
    return translation;
  }, page, browser);
};
