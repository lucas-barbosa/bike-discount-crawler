import { type CookieParam, type Browser, type Page, type ElementHandle } from 'puppeteer';
import { getBrowserPool } from './browser-pool';
import { getBrowserManager } from './browser-manager';

export const runAndDispose = async (callback: () => Promise<any>, page: Page, browser: Browser) => {
  try {
    const result = await callback();
    return result;
  } catch (err) {
    throw err;
  } finally {
    await disposeCrawler(page, browser);
  }
};

export const startCrawler = async (initialBrowser?: Browser) => {
  const manager = getBrowserManager();
  const browser = initialBrowser ?? await manager.acquireBrowser()

  const page = await manager.getPage(browser);
  await page.setViewport({ width: 1366, height: 768 });

  return { browser, page };
};

export const disposeCrawler = async (page: Page, browser: Browser) => {
  await page.close();
  // await pool.releaseBrowser(browser);
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

export const getOnClick = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.getAttribute('onclick'), element))?.trim() ?? '';
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

export const getSrc = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.getAttribute('src'), element)) ?? '';
};

export const getClasses = async (page: Page, element: ElementHandle) => {
  return (await page.evaluate(x => x.className, element)).split(' ') ?? [];
};

export const hasClass = async (page: Page, element: ElementHandle, className: string) => {
  return (await getClasses(page, element)).includes(className);
}
