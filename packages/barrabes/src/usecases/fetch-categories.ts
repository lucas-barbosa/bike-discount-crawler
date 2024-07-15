import { listCategories } from '@crawler/actions/list-categories';
import { saveCategories } from '@infrastructure/categories';
import { generateCategoriesTree } from './generate-categories-tree';

export const fetchCategories = async () => {
  const categories = await listCategories().catch(err => {
    console.warn(err);
    return null;
  });

  if (categories) {
    await saveCategories(categories);
    await generateCategoriesTree();
  }

  return categories;
};
