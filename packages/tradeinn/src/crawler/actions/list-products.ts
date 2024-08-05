import axios from 'axios';
import { type CategorySearch } from '@crawlers/base/dist/types/CategorySearch';
import { getRequestBody, PAGE_SIZE } from '@crawler/utils/list-products-request-body';
import { normalize } from '@crawler/utils/normalize';

export const listProducts = async (parentId: string, categoryId: string, categoryUrl: string, pageNumber: number = 1): Promise<CategorySearch> => {
  const products = await requestProducts(parentId, categoryId, pageNumber, categoryUrl);
  const hasNextPage = products.length === PAGE_SIZE;
  const storeUrl = getStoreUrl(categoryUrl);
  const productLinks = products.map(({ _source: product }: any) => {
    const brand = product.marca;
    const productId = product.id_modelo;
    const model = product.model.por ?? product.model.en;
    const title = normalize(`${brand} ${model}`);
    return `${storeUrl}/${title}/${productId}/p`;
  });

  return {
    hasNextPage,
    productLinks
  };
};

const getStoreUrl = (url: string) => {
  const parsedUrl = new URL(url);
  const basePathArray = parsedUrl.pathname.split('/').filter(Boolean);
  return parsedUrl.origin + '/' + basePathArray[0] + '/' + basePathArray[1];
};

const requestProducts = async (parentId: string, categoryId: string, pageNumber: number, categoryUrl: string) => {
  const body = getRequestBody(pageNumber, parentId, categoryId);
  const { data } = await axios.post('https://sr.tradeinn.com/', body, {
    headers: {
      referer: categoryUrl,
      origin: 'https://www.tradeinn.com',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    }
  });
  return data.hits.hits || [];
};
