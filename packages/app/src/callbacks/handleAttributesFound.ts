import { enqueueAttributes } from '#queue/attributes';
import { logger } from '@crawlers/base';

export const handleAttributesFound = async (attributes: any[]) => {
  logger.info({ count: attributes.length }, 'Enqueue attributes');
  await enqueueAttributes(attributes);
};
