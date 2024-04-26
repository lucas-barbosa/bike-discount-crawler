import { getByKey, saveByKey } from './utils';

const COLUMN_NAME = 'login_cookies';

export const getCookies = () => {
  return getByKey(COLUMN_NAME) ?? '';
};

export const saveCookies = async (cookies: string) => {
  await saveByKey(COLUMN_NAME, cookies);
};
