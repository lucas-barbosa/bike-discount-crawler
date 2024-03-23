import { disposeCrawler, getUrl, startCrawler } from '@crawler/utils/crawler';
import { loginIfRequired } from '@middlewares/login-if-required';

export const listProducts = async (categoryUrl: string, pageNumber: number = 1): Promise<BikeDiscountCategorySearch> => {
  const { page, browser } = await startCrawler();

  const query = new URLSearchParams({
    p: pageNumber.toString(),
    o: '1', // order
    n: '48' // quantity
  });

  await page.goto(`${categoryUrl}?${query.toString()}`);
  await loginIfRequired(page);

  const [products, nextPageButton] = await Promise.all([
    page.$$('xpath/.//div[contains(@class, "listing")]/div[contains(@class, "product--box")]//div[contains(@class, "product--info")]/a[contains(@class, "product--title")]'),
    page.$$('xpath/.//div[contains(@class, "listing--paging")]//a[contains(@class, "paging--next") and @title = "Next page"]')
  ]);

  const hasNextPage = nextPageButton.length > 0;
  const productLinks = await Promise.all(products.map(x => getUrl(page, x)));

  await disposeCrawler(page, browser);
  return {
    hasNextPage,
    productLinks
  };
};
