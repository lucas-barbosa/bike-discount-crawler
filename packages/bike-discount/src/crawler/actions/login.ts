import { exportCookies, startCrawler } from '@crawler/utils/crawler';
import { runAndDispose } from '@crawlers/base/dist/crawler/utils';

export const login = async (email: string, password: string) => {
  const { page, browser } = await startCrawler();

  return runAndDispose(async () => {
    await page.goto('https://www.bike-discount.de/en/account');
    await page.type('#email', email);
    await page.type('#passwort', password);

    await Promise.all([
      page.$eval('#login--form [type=submit]', (x: any) => { (x as HTMLButtonElement).click(); }),
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

    return cookies;
  }, page, browser);
};
