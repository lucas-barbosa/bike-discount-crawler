import { disposeOnFail, startCrawler } from '@crawlers/base/dist/crawler/utils';

export const navigate = async (productUrl: string, language: string = 'pt') => {
  const { page, browser } = await startCrawler();

  return disposeOnFail(async () => {
    if (language) {
      productUrl = getTranslatedProductUrl(productUrl, language);
    }

    await page.goto(productUrl);

    return {
      page,
      browser
    };
  }, page, browser);
};

const getTranslatedProductUrl = (productUrl: string, language: string) => {
  const regex = /(tradeinn\.com\/[a-z]+\/)([a-z]{2})(\/)/;
  return productUrl.replace(regex, `$1${language}$3`);
};
