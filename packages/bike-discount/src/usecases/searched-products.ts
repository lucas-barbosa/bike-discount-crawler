import { getSearchedProducts, saveSearchedProducts } from '@crawlers/base/dist/infrastructure/searched-products';

export const isProductSearched = (url: string) => getSearchedProducts('BD', url);
export const setProductSearched = (url: string) => saveSearchedProducts('BD', url);
