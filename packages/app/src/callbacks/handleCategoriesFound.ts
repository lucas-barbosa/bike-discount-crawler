import { type CategoriesFoundCallback } from '@crawlers/bike-discount/dist/queue/categories';
import { enqueueCategories } from '#queue/categories';

export const handleCategoriesFound: CategoriesFoundCallback = async (categories: any[]) => {
  console.log('Enqueue categories:');
  await enqueueCategories(categories);
};
