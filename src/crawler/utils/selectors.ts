import { type Page } from 'puppeteer';

export const checkIsLogged = async (page: Page) => {
  const loginButton = await page.$('.navigation--signin-btn');
  return !loginButton;
};
