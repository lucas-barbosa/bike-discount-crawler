import { type TranslationFoundCallback } from '@crawlers/bike-discount/dist/queue/translate';
import { type Translation } from '@crawlers/bike-discount/dist/types/Translation';
import { enqueueTranslation } from '#queue/translation';

export const handleTranslationFound: TranslationFoundCallback = async (translation: Translation) => {
  console.log('Enqueue translation');
  await enqueueTranslation(translation);
};
