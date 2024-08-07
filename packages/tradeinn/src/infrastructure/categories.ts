import { type Category } from '@crawlers/base/dist/types/Category';
import { getByKey, saveByKey } from './utils';

const COLUMN_NAME = 'categories';

export const getCategories = async (): Promise<Category[] | null> => {
  const categories = await getByKey(COLUMN_NAME);
  if (categories) return JSON.parse(categories);
  return null;
};

export const saveCategories = async (categories: Category[]) => {
  await saveByKey(COLUMN_NAME, JSON.stringify(categories));
};
