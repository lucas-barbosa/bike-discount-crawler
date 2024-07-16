import { getSearchedProducts, saveSearchedProducts } from '@crawlers/base/dist/infrastructure/searched-products';

export const isProductSearched = (url: string) => getSearchedProducts('BB', url);
export const setProductSearched = (url: string) => saveSearchedProducts('BB', url);
