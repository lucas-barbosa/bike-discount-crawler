import { getSearchedProducts, saveSearchedProducts } from '@crawlers/base/dist/infrastructure/searched-products';
import { CRAWLER_ID } from '@infrastructure/utils';

export const isProductSearched = (url: string) => getSearchedProducts(CRAWLER_ID, url);
export const setProductSearched = (url: string) => saveSearchedProducts(CRAWLER_ID, url);
