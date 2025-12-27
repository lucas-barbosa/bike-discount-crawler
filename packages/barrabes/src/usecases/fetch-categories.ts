import { listCategories, listProCategories } from '@crawler/actions/list-categories';
import { saveCategories } from '@infrastructure/categories';
import { generateCategoriesTree } from './generate-categories-tree';
import { logger } from '@crawlers/base';

export const fetchCategories = async () => {
  const categories = await listCategories().catch(err => {
    logger.error({ err }, 'Error fetching categories');
    return null;
  });

  const proCategories = await listProCategories().catch(err => {
    logger.error({ err }, 'Error fetching pro categories');
    return null;
  });

  const allCategories = {
    barrabes: categories ?? [],
    pro: proCategories ?? []
  };

  if (!!categories || !!proCategories) {
    await saveCategories(allCategories);
    await generateCategoriesTree();
  }

  return allCategories;
};
