import { startCrawler } from '@crawler/utils/crawler';
import { loginIfRequired } from '@middlewares/login-if-required';

export const navigate = async (productUrl: string, language?: string, shouldLogin = true) => {
  const { page, browser } = await startCrawler();

  if (language) {
    productUrl = productUrl.replace(/(bike-discount\.de\/)[a-z]{2}(\/)/, `$1${language}$2`);
  }

  const query = new URLSearchParams({
    __delivery: '279'
  });

  await page.goto(`${productUrl}?${query.toString()}`);
  if (shouldLogin) await loginIfRequired(page);

  return {
    page,
    browser
  };
};