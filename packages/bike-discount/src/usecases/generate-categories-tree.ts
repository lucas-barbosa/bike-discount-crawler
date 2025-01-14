import { getCategories } from '@infrastructure/categories';
import { getCategoriesTree } from '@crawlers/base/dist/usecases/get-categories-tree';
import { saveCategories } from '@crawlers/base/dist/infrastructure/categories-tree';

export const generateCategoriesTree = async () => {
  const categories = await getCategories();
  if (!categories) return;

  const categoriesTree = getCategoriesTree(categories);
  await saveCategories('BD', categoriesTree);
};
