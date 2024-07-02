import { type Translation } from '@crawlers/bike-discount/src/types/Translation';
import { publish } from './base';

export const publishTranslationChanges = async (translation: Translation) => {
  await publish('translate', translation);
};
