import { getTranslation } from '@crawler/actions/get-translation';

export const fetchTranslation = async (productUrl: string, language: string) => {
  return await getTranslation(productUrl, language)
    .catch(err => {
      console.warn(err);
      return null;
    });
};
