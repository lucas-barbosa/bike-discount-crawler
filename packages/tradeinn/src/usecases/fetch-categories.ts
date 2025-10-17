import { type CategoryAttribute } from '@crawlers/base/dist/types/CategoryAttributes';
import { listCategories, type TradeInnStore } from '@crawler/actions/list-categories';

import { saveCategories } from '@infrastructure/categories';
import { generateCategoriesTree } from './generate-categories-tree';
import { listAttributes } from '@crawler/actions/list-attributes';
import { saveAttributes } from '@infrastructure/attributes';

const collectLastCategories = (node: TradeInnStore, storeId: string, parentId: string): Array<{ storeId: string, categoryId: string, parentId: string, url: string }> => {
  if (!node.childs || node.childs.length === 0) {
    return [{
      storeId,
      parentId,
      categoryId: node.id,
      url: node.url
    }];
  }

  return node.childs.flatMap(child => collectLastCategories(child, storeId, node.id));
};

export const fetchCategories = async () => {
  const categories = await listCategories().catch(err => {
    console.warn(err);
    return null;
  });

  if (categories) {
    await saveCategories(categories);
    await generateCategoriesTree();
  }

  const lastCategories = categories?.flatMap(root => collectLastCategories(root, root.id, root.id));
  let attributes: CategoryAttribute[] = [];

  if (lastCategories && lastCategories.length > 0) {
    const allAttributes = await Promise.all(
      lastCategories.map(category => listAttributes(category.storeId, category.parentId, category.categoryId, category.url)
        .then(x => ({ ...category, attributes: x }))
        .catch((err) => {
          console.log(`Failed to load category [${category.categoryId}] - store [${category.parentId}] - err [${err?.message}]`);
          return { ...category, attributes: [] };
        })));

    attributes = allAttributes.filter(x => !!x && x.attributes.length > 0);
  }

  if (attributes) {
    await saveAttributes(attributes);
  }

  return { categories, attributes };
};
