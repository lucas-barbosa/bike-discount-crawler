import { listCategories } from '@crawler/actions/list-categories';
import { saveCategories } from '@infrastructure/categories';
import { generateCategoriesTree } from './generate-categories-tree';
import { logger } from '@crawlers/base';

export const fetchCategories = async () => {
  const categories = await listCategories().catch(err => {
    logger.error({ err }, 'Error fetching categories');
    return null;
  });

  if (categories) {
    await saveCategories(categories);
    await generateCategoriesTree();
  }

  return categories;
};
