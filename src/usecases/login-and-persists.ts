import { login } from '@crawler/actions/login';
import { saveCookies } from '@infrastructure/cookies';
import { getCrawlerLogin } from '@infrastructure/crawler-settings';

export const loginAndPersists = async () => {
  const loginSettings = await getCrawlerLogin();
  if (!loginSettings) return { isLogged: false, cookies: null };

  const cookies = await login(loginSettings.email, loginSettings.password);
  await saveCookies(cookies);

  const isLogged = !!cookies;
  return { isLogged, cookies };
};
