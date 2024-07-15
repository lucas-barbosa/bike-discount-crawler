import { Category } from '@entities/Category';
import { CategoryTree } from '@entities/CategoryTree';

export const getCategoriesTree = (categories: Category[], path: string[] = []) => {
  let results: CategoryTree[] = [];

  categories.forEach(category => {
    const newPath = [...path, category.name];

    if (category.childs.length === 0) {
      results.push({
        url: category.url,
        tree: newPath
      });
    } else {
      results = results.concat(getCategoriesTree(category.childs, newPath));
    }
  });

  return results;
};
