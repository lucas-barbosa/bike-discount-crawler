import { getRedis } from './utils';

const COLUMN_NAME = 'searched-products';

const getColumnName = (url: string) => `${COLUMN_NAME}@${url}`;

export const getSearchedProducts = async (crawlerId: string, url: string) => {
  const { getByKey } = getRedis(crawlerId);
  const product = await getByKey(getColumnName(url));
  return !!product;
};

export const saveSearchedProducts = async (crawlerId: string, url: string) => {
  const { saveByKey } = getRedis(crawlerId);
  await saveByKey(getColumnName(url), 'true');
};
