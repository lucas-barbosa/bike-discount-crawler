import { listCategories } from '@crawler/actions/list-categories';
import { saveCategories } from '@infrastructure/categories';
import { generateCategoriesTree } from './generate-categories-tree';
import { captureSwallowed } from '@crawlers/base';

export const fetchCategories = async () => {
  const categories = await listCategories().catch(err => captureSwallowed(err, 'Error fetching categories', {
    tags: { store: 'bike-discount', usecase: 'fetch-categories' },
    level: 'error'
  }));

  if (categories) {
    await saveCategories(categories);
    await generateCategoriesTree();
  }

  return categories;
};
