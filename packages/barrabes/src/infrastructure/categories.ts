import { getByKey, saveByKey } from './utils';
import { BarrabesCategories } from '@entities/BarrabesCategories';

const COLUMN_NAME = 'categories';

export const getCategories = async (): Promise<BarrabesCategories | null> => {
  const categories = await getByKey(COLUMN_NAME);
  if (categories) return JSON.parse(categories);
  return null;
};

export const saveCategories = async (categories: BarrabesCategories) => {
  await saveByKey(COLUMN_NAME, JSON.stringify(categories));
};
