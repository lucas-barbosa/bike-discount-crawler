import { getByKey, saveByKey } from './utils';
import { type CategoryAttribute } from '@crawlers/base/dist/types/CategoryAttributes';

const COLUMN_NAME = 'attributes';

export const getAttributes = async (): Promise<CategoryAttribute[] | null> => {
  const attributes = await getByKey(COLUMN_NAME);
  if (attributes) return JSON.parse(attributes);
  return null;
};

export const saveAttributes = async (attributes: CategoryAttribute[]) => {
  await saveByKey(COLUMN_NAME, JSON.stringify(attributes));
};
