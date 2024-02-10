import { type CookieParam, type Browser, type Page } from 'puppeteer';
import { getCrawlerClient } from '@crawler/client';

export const startCrawler = async () => {
  const client = getCrawlerClient();
  const browser = await client.launch();
  const page = await browser.newPage();
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
  if (parsedCookies) await page.setCookie(...parsedCookies);
};
