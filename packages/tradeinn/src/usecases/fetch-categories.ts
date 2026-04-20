import { type CategoryAttribute } from '@crawlers/base/dist/types/CategoryAttributes';
import { listCategories, type TradeInnStore } from '@crawler/actions/list-categories';

import { saveCategories } from '@infrastructure/categories';
import { generateCategoriesTree } from './generate-categories-tree';
import { listAttributes } from '@crawler/actions/list-attributes';
import { saveAttributes } from '@infrastructure/attributes';
import { captureSwallowed } from '@crawlers/base';

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
  const categories = await listCategories().catch(err => captureSwallowed(err, 'Error fetching categories', {
    tags: { store: 'tradeinn', usecase: 'fetch-categories' }
  }));

  if (categories) {
    await saveCategories(categories);
  }

  const lastCategories = categories?.flatMap(root => collectLastCategories(root, root.id, root.id));
  let attributes: CategoryAttribute[] = [];

  if (lastCategories && lastCategories.length > 0) {
    const allAttributes = await Promise.all(
      lastCategories.map(category => listAttributes(category.storeId, category.parentId, category.categoryId, category.url)
        .then(x => ({ ...category, attributes: x }))
        .catch((err) => captureSwallowed(err, `Failed to load category [${category.categoryId}] - store [${category.parentId}]`, {
          tags: { store: 'tradeinn', usecase: 'fetch-categories', kind: 'attributes' },
          extra: { categoryId: category.categoryId, parentId: category.parentId, url: category.url },
          fallback: { ...category, attributes: [] }
        }))));

    attributes = allAttributes.filter(x => !!x && x.attributes.length > 0);
  }

  if (attributes) {
    await saveAttributes(attributes);
  }

  if (categories) {
    await generateCategoriesTree();
  }

  return { categories, attributes };
};
