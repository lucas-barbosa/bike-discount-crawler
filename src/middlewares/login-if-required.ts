import { type Page } from 'puppeteer';
import { checkIsLogged } from '@crawler/utils/selectors';
import { loginAndPersists } from '../usecases/login-and-persists';

export const loginIfRequired = async (page: Page) => {
  let isLogged = await checkIsLogged(page);
  if (!isLogged) isLogged = await loginAndPersists();
  return isLogged;
};
