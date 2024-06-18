import { getCategories } from '@infrastructure/categories';
import { type CategoryTree } from '@crawlers/base/dist/types/CategoryTree';
import { saveCategories } from '@crawlers/base/dist/infrastructure/categories-tree';

export const generateCategoriesTree = async () => {
  const categories = await getCategories();
  if (!categories) return;

  const categoriesTree = getCategoryTree(categories);
  await saveCategories('BD', categoriesTree);
};

const getCategoryTree = (categories: BikeDiscountCategory[], path: string[] = []) => {
  let results: CategoryTree[] = [];

  categories.forEach(category => {
    const newPath = [...path, category.name];

    if (category.childs.length === 0) {
      results.push({
        url: category.url,
        tree: newPath
      });
    } else {
      results = results.concat(getCategoryTree(category.childs, newPath));
    }
  });

  return results;
};
