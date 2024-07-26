import { listCategories, listProCategories } from '@crawler/actions/list-categories';
import { saveCategories } from '@infrastructure/categories';
import { generateCategoriesTree } from './generate-categories-tree';

export const fetchCategories = async () => {
  const categories = await listCategories().catch(err => {
    console.warn(err);
    return null;
  });

  const proCategories = await listProCategories().catch(err => {
    console.warn(err);
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
