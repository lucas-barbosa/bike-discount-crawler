import { getByKey, saveByKey } from './utils';

const COLUMN_NAME = 'api_keys';

export const getApiKeys = async () => {
  const value = await getByKey(COLUMN_NAME);
  if (value) return JSON.parse(value);
  return [];
};

export const saveApiKeys = async (apiKey: string) => {
  const existingKeys = await getApiKeys();
  existingKeys.push(apiKey);
  await saveByKey(COLUMN_NAME, JSON.stringify(existingKeys));
};