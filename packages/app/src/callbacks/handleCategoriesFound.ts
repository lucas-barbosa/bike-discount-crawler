import { type CategoriesFoundCallback } from '@crawlers/bike-discount/dist/queue/categories';
import { logger } from '@crawlers/base';
import { enqueueCategories } from '#queue/categories';

export const handleCategoriesFound: CategoriesFoundCallback = async (categories: any[]) => {
  logger.info({ count: categories.length }, 'Enqueue categories');
  await enqueueCategories(categories);
};
