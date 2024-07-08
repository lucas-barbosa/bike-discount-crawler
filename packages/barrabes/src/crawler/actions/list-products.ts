import axios from 'axios';
import { load, type CheerioAPI } from 'cheerio';
import { request } from '@crawler/utils/request';
import { type CategorySearch } from '@crawlers/base/dist/types/CategorySearch';
import { addPrefixIfRelative } from '@crawler/utils/url';

export const listProducts = async (categoryUrl: string, pageNumber: number = 1): Promise<CategorySearch> => {
  let productLinks: string[] = [];
  let hasNextPage = false;

  if (pageNumber > 1) {
    const categoryId = Number(categoryUrl.split('-').pop() ?? '');
    if (!isNaN(categoryId)) {
      productLinks = await getPaginatedProducts(categoryId, pageNumber);
      hasNextPage = productLinks.length > 0;
    }
  } else {
    const $ = await request(categoryUrl);
    productLinks = getProductUrls($);
    hasNextPage = getHasNextPage($);
  }

  return {
    hasNextPage,
    productLinks
  };
};

const getProductUrls = ($: CheerioAPI) => {
  const products = $('.fichaProducto .card-content a');
  return products.map((i, element) => $(element).attr('href') ?? '')
    .get()
    .filter((url: string) => url.length > 0)
    .map(addPrefixIfRelative);
};

const getHasNextPage = ($: CheerioAPI) => {
  const element = $('#masListadoproductos');
  return element.length > 0 && element.css('display') !== 'none';
};

const getPaginatedProducts = async (categoryId: number, pageNumber: number) => {
  const { data } = await axios.post('https://www.barrabes.com/pt/filtrarproductos', {
    precioMinimo: '0',
    precioMaximo: '999999999',
    idCategoria: categoryId,
    orden: 'DescuentoDescendente',
    tipoCategoria: 2,
    pagenum: pageNumber,
    idPromocion: -1
  });

  const $ = load(data);
  return getProductUrls($);
};
