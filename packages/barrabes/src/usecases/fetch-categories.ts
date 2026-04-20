import { listCategories, listProCategories } from '@crawler/actions/list-categories';
import { saveCategories } from '@infrastructure/categories';
import { generateCategoriesTree } from './generate-categories-tree';
import { captureSwallowed } from '@crawlers/base';

export const fetchCategories = async () => {
  const categories = await listCategories().catch(err => captureSwallowed(err, 'Error fetching categories', {
    tags: { store: 'barrabes', usecase: 'fetch-categories' },
    level: 'error'
  }));

  const proCategories = await listProCategories().catch(err => captureSwallowed(err, 'Error fetching pro categories', {
    tags: { store: 'barrabes', usecase: 'fetch-categories', kind: 'pro' },
    level: 'error'
  }));

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
