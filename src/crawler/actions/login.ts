import { disposeCrawler, exportCookies, startCrawler } from '@crawler/utils/crawler';

export const login = async (email: string, password: string) => {
  const { page, browser } = await startCrawler();

  await page.goto('https://www.bike-discount.de/en/account');
  await page.type('#email', email);
  await page.type('#passwort', password);

  await Promise.all([
    page.click('#login--form [type=submit]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' })
  ]);

  const isLogged = await Promise.race([
    page.waitForSelector('#login--form [type=submit]', { timeout: 10000 }).then(() => Promise.resolve(false)),
    page.waitForSelector('a[title=Logout]', { timeout: 10000 }).then(() => Promise.resolve(true))
  ]);

  let cookies = '';
  if (isLogged) {
    cookies = await exportCookies(page);
  }

  await disposeCrawler(page, browser);
  return cookies;
};
