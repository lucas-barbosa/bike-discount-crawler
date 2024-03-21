import { type CookieParam, type Browser, type Page, type ElementHandle } from 'puppeteer';
import { getCrawlerClient } from '@crawler/client';
import { getCookies } from '@infrastructure/cookies';

export const startCrawler = async (initialBrowser?: Browser, initialCookies?: string) => {
  const client = getCrawlerClient();
  const browser = initialBrowser ?? await client.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768 });

  const cookies = initialCookies ?? await getCookies();
  if (cookies) await importCookies(page, cookies);

  return { browser, page };
};

export const disposeCrawler = async (page: Page, browser: Browser) => {
  await page.close();
  await browser.close();
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

export const getTextNode = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.textContent, element)) ?? '';
};

export const getUrl = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.getAttribute('href'), element)) ?? '';
};

export const getClasses = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.className, element)).split(' ') ?? [];
};
