import { getTranslation } from '@crawler/actions/get-translation';
import { logger } from '@crawlers/base';

export const fetchTranslation = async (productUrl: string, language: string) => {
  return await getTranslation(productUrl, language)
    .catch(err => {
      logger.warn({ err }, 'Error fetching translation');
      return null;
    });
};
