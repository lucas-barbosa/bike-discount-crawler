import { listCategories } from '@crawler/actions/list-categories';
import { saveCategories } from '@infrastructure/categories';

export const fetchCategories = async () => {
  const categories = await listCategories();
  await saveCategories(categories);
};
