import { getCategories } from '@infrastructure/categories';
import { saveCategories } from '@crawlers/base/dist/infrastructure/categories-tree';
import { CRAWLER_ID } from '../config';
import { getAttributes } from '@infrastructure/attributes';

import { type Category } from '@crawlers/base/dist/types/Category';
import { type CategoryAttribute } from '@crawlers/base/dist/types/CategoryAttributes';
import { type CategoryTree } from '@crawlers/base/dist/types/CategoryTree';

export const generateCategoriesTree = async () => {
  const categories = await getCategories();
  if (!categories) return;

  const attributes = await getAttributes();

  const categoriesTree = getCategoriesTree(categories, [], attributes);
  await saveCategories(CRAWLER_ID, categoriesTree);
};

const getParamsFromUrl = (url: string): { categoryId: string, parentId: string } | null => {
  try {
    const urlObj = new URL(url);
    const parentId = urlObj.searchParams.get('parentId');
    const categoryId = urlObj.searchParams.get('categoryId');

    if (!parentId || !categoryId) {
      return null;
    }

    // Handle pipe-separated categoryId (e.g., "9|492|1442")
    const categoryParts = categoryId.split('|');
    return {
      categoryId: categoryParts[0],
      parentId
    };
  } catch {
    return null;
  }
};

export const getCategoriesTree = (categories: Category[], path: string[] = [], attributes: CategoryAttribute[] | null = null) => {
  let results: CategoryTree[] = [];

  categories.forEach(category => {
    const newPath = [...path, category.name];

    if (category.childs.length === 0) {
      results.push({
        url: category.url,
        tree: newPath
      });

      // If attributes array is provided, check for matching attributes
      if (attributes && attributes.length > 0) {
        const params = getParamsFromUrl(category.url);

        if (params) {
          const matchingAttribute = attributes.find(
            attr => attr.categoryId === params.categoryId && attr.parentId === params.parentId
          );

          if (matchingAttribute) {
            // For each attribute, add all its values as separate paths
            matchingAttribute.attributes.forEach(attr => {
              attr.values.forEach(value => {
                results.push({
                  url: `${category.url}|${attr.id}|${value.id}`,
                  tree: [...newPath, value.name]
                });
              });
            });
          }
        }
      }
    } else {
      results = results.concat(getCategoriesTree(category.childs, newPath, attributes));
    }
  });

  return results;
};
