import { type TranslationFoundCallback } from '@crawlers/bike-discount/dist/queue/translate';
import { type Translation } from '@crawlers/bike-discount/dist/types/Translation';
import { logger } from '@crawlers/base';
import { enqueueTranslation } from '#queue/translation';

export const handleTranslationFound: TranslationFoundCallback = async (translation: Translation) => {
  logger.info('Enqueue translation');
  await enqueueTranslation(translation);
};
