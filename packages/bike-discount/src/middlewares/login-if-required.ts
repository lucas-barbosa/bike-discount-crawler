import { type Page } from 'puppeteer';
import { checkIsLogged } from '@crawler/utils/selectors';
import { importCookies } from '@crawler/utils/crawler';
import { loginAndPersists } from '../usecases/login-and-persists';

export const loginIfRequired = async (page: Page) => {
  const isLogged = await checkIsLogged(page);

  if (!isLogged) {
    const { isLogged, cookies } = await loginAndPersists();
    if (isLogged && cookies) {
      await importCookies(page, cookies);
      await page.reload();
    }
    return isLogged;
  }

  return isLogged;
};
