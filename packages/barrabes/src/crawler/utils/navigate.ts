import { startCrawler } from '@crawlers/base/dist/crawler/utils';

export const navigate = async (productUrl: string, language: string = 'pt') => {
  const { page, browser } = await startCrawler();

  if (language) {
    productUrl = getTranslatedProductUrl(productUrl, language);
  }

  await page.goto(productUrl);

  return {
    page,
    browser
  };
};

const getTranslatedProductUrl = (productUrl: string, language: string) => {
  const regex = /(barrabes\.com\/)([a-z]{2}\/)?/;
  const matches = productUrl.match(regex);

  if (!matches) {
    return productUrl;
  }

  if (language === 'es') {
    return productUrl.replace(regex, `${matches[1]}`);
  }

  return productUrl.replace(regex, `${matches[1]}${language}/`);
};
