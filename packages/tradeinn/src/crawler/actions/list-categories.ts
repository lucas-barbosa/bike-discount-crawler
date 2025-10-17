import axios from 'axios';
import { type CheerioAPI, load } from 'cheerio';
import { normalize } from '@crawler/utils/normalize';

export interface TradeInnStore {
  id: string
  name: string
  url: string
  childs: TradeInnStore[]
}

export const listCategories = async (): Promise<TradeInnStore[]> => {
  const url = 'https://www.tradeinn.com/pt';
  const { data } = await axios.get(url);
  const $ = load(data);

  const stores = await listStores($);

  const categories = await Promise.all(stores.map(async (store): Promise<TradeInnStore> => {
    const childs = await getStoreCategories(store);
    return {
      ...store,
      childs
    };
  }));

  return categories;
};

const listStores = async ($: CheerioAPI): Promise<TradeInnStore[]> => {
  const storeElements = $('.nav-logos-wrapper:not(.nav-logos-wrapper__mobile) .nav-logos-container .nav-logo__tiendas a');
  const stores = storeElements.map((i, element): TradeInnStore => {
    const id = $(element).data('shop') ?? '';
    let href = $(element).attr('href') ?? '';
    if (href.startsWith('/')) {
      href = href.slice(1);
    }
    const storeName = href.trim().split('/')[0];
    return {
      url: href,
      id: id as string,
      name: storeName,
      childs: []
    };
  }).get();
  return stores;
};

interface TradeInnStoreCategory {
  por: string
  subfamilias: TradeInnStoreCategory[]
}

const sportsStores = {
  18: 'hunt',
  19: 'horse-riding',
  20: 'golf',
  21: 'basketball',
  22: 'baseball',
  23: 'american-football',
  24: 'handball',
  25: 'hockey',
  26: 'rugby',
  27: 'volleyball',
  28: 'nutrition'
} as any;

const addPrefixToUrl = (url: string) => `https://www.tradeinn.com${url}`;

const getStoreCategories = async (store: TradeInnStore): Promise<TradeInnStore[]> => {
  const url = `https://www.tradeinn.com/get_dades.php?tienda_super_forzada=1&id_tienda_forzada=${store.id}`;
  const { data } = await axios.get(url);
  if (Number(store.id) > 17) {
    return formatSportsCategories(data.categorias, store.name, store.url);
  }
  return formatCategories(data.categorias, store.url);
};

const formatSportsCategories = (categories: TradeInnStoreCategory[], storeName: string, storeUrl: string) => {
  return Object.keys(categories)
    .map((key) => {
      const sanitizedKey = key.replace('-', '');
      const categoryName = sportsStores[sanitizedKey] ? sportsStores[sanitizedKey] : storeName;
      const parentUrl = sportsStores[sanitizedKey] ? `${sportsStores[sanitizedKey]}/pt` : storeUrl;
      return {
        id: sanitizedKey,
        name: categoryName,
        url: addPrefixToUrl(parentUrl),
        childs: formatCategories((categories as any)[key], parentUrl)
      };
    });
};

const formatCategories = (categories: TradeInnStoreCategory[], parentUrl: string): TradeInnStore[] => {
  return Object.entries<TradeInnStoreCategory>(categories)
    .map(([categoryId, category]) => {
      const categoryName = category.por;
      const categoryHref = `/${parentUrl}/${normalize(categoryName)}/${categoryId}/f?parentId=${categoryId}`;

      const subcategories = formatSubcategories(category.subfamilias, categoryName, parentUrl, categoryId);

      return {
        id: categoryId,
        name: categoryName,
        url: addPrefixToUrl(categoryHref),
        childs: subcategories
      };
    });
};

const formatSubcategories = (categories: TradeInnStoreCategory[], parentName: string, parentUrl: string, parentId: string): TradeInnStore[] => {
  return Object.entries<TradeInnStoreCategory>(categories)
    .map(([subcategoryId, subcategory]) => {
      const subcategoryName = subcategory.por;
      const subcategoryUrl = `/${parentUrl}/${normalize(parentName)}-${normalize(subcategoryName)}/${subcategoryId}/s?parentId=${parentId}&categoryId=${subcategoryId}`;
      return {
        id: subcategoryId,
        name: subcategoryName,
        url: addPrefixToUrl(subcategoryUrl),
        childs: []
      };
    });
};
