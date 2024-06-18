import { CategoryTree } from '@entities/CategoryTree';
import { getRedis } from './utils';

const COLUMN_NAME = 'categories-tree';

const getColumnName = (url: string) => `${COLUMN_NAME}@${url}`;

export const getCategoryTree = async (crawlerId: string, url: string) => {
  const { getByKey } = getRedis(crawlerId);
  const category = await getByKey(getColumnName(url));
  if (category) return JSON.parse(category);
  return null;
};

export const saveCategories = async (crawlerId: string, categoryTree: CategoryTree[]) => {
  const { saveMany } = getRedis(crawlerId);
  const items = categoryTree.map((category) => ({
    key: getColumnName(category.url),
    value: JSON.stringify(category.tree)
  }));
  await saveMany(items)
};
