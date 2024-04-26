import { getByKey, saveByKey } from './utils';

const COLUMN_NAME = 'categories';

export const getCategories = async () => {
  const categories = await getByKey(COLUMN_NAME);
  if (categories) return JSON.parse(categories);
  return '';
};

export const saveCategories = async (categories: BikeDiscountCategory[]) => {
  await saveByKey(COLUMN_NAME, JSON.stringify(categories));
};
