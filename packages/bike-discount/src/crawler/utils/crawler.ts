import { type CookieParam, type Page, type ElementHandle } from 'puppeteer';
import { startCrawler as baseStartCrawler, disposeOnFail } from '@crawlers/base/dist/crawler/utils';
import { getCookies } from '@infrastructure/cookies';

export const startCrawler = async (initialCookies?: string) => {
  const { browser, page } = await baseStartCrawler();

  return disposeOnFail(async () => {
    const cookies = initialCookies ?? await getCookies();
    if (cookies) await importCookies(page, cookies);

    return {
      page,
      browser
    };
  }, page, browser);
};

export const exportCookies = async (page: Page) => {
  const cookies = await page.cookies();
  if (!cookies) return '';
  return JSON.stringify(cookies);
};

export const importCookies = async (page: Page, cookies: string) => {
  const parsedCookies = JSON.parse(cookies) as CookieParam[];
  if (parsedCookies) {
    await page.setCookie(...parsedCookies);
  }
};

export const getPropertyContent = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.getAttribute('content'), element))?.trim() ?? '';
};

export const getTextNode = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.textContent, element))?.trim() ?? '';
};

export const getUrl = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.getAttribute('href'), element)) ?? '';
};

export const getClasses = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.className, element)).split(' ') ?? [];
};
