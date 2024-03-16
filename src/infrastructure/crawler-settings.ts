import { getByKey, saveByKey } from './utils';

const COLUMN_NAME = 'login_settings';

export const getCrawlerLogin = async () => {
  const login = await getByKey(COLUMN_NAME);
  if (!login) return null;

  const parsedLogin = JSON.parse(login);
  return {
    email: parsedLogin.email.toString(),
    password: parsedLogin.password.toString()
  };
};

export const saveCrawlerLogin = async (email: string, password: string) => {
  await saveByKey(COLUMN_NAME, {
    email,
    password
  });
};
