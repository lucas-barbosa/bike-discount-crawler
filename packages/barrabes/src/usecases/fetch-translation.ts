import { getTranslation } from '@crawler/actions/get-translation';
import { captureSwallowed } from '@crawlers/base';

export const fetchTranslation = async (productUrl: string, language: string) => {
  return await getTranslation(productUrl, language)
    .catch(err => captureSwallowed(err, 'Error fetching translation', {
      tags: { store: 'barrabes', usecase: 'fetch-translation' },
      extra: { productUrl, language }
    }));
};
