import { getSelectedCategories } from '@infrastructure/crawler-settings';
import { cleanQueueCategory, enqueueCategory } from '../queue/category';

export const enqueueSelectedCategories = async () => {
  await cleanQueueCategory();
  const categories = await getSelectedCategories();
  if (!categories) return;
  for (const category of categories) {
    await enqueueCategory({
      categoryUrl: category,
      page: 1
    }, 30 * 24 * 60 * 60 * 1000); // (days * hours * minutes * seconds * milliseconds)"
  };
};
