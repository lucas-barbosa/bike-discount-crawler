import axios from 'axios';
import { type CheerioAPI, load } from 'cheerio';
import { type Category } from '@crawlers/base/dist/types/Category';
import { normalize } from '@crawler/utils/normalize';

interface TradeInnStore {
  id: string
  name: string
  url: string
  childs: TradeInnStore[]
}

export const listCategories = async (): Promise<Category[]> => {
  const url = 'https://www.tradeinn.com/pt';
  const { data } = await axios.get(url);
  const $ = load(data);

  const stores = await listStores($);

  const categories = await Promise.all(stores.map(async (store): Promise<Category> => {
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

const getStoreCategories = async (store: TradeInnStore): Promise<Category[]> => {
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
        name: categoryName,
        url: parentUrl,
        childs: formatCategories((categories as any)[key], parentUrl)
      };
    });
};

const formatCategories = (categories: TradeInnStoreCategory[], parentUrl: string): Category[] => {
  return Object.entries<TradeInnStoreCategory>(categories)
    .map(([categoryId, category]) => {
      const categoryName = category.por;
      const categoryHref = `/${parentUrl}/${normalize(categoryName)}/${categoryId}/f`;

      const subcategories = formatSubcategories(category.subfamilias, categoryName, parentUrl);

      return {
        name: categoryName,
        url: categoryHref,
        childs: subcategories
      };
    });
};

const formatSubcategories = (categories: TradeInnStoreCategory[], parentName: string, parentUrl: string): Category[] => {
  return Object.entries<TradeInnStoreCategory>(categories)
    .map(([subcategoryId, subcategory]) => {
      const subcategoryName = subcategory.por;
      return {
        name: subcategoryName,
        url: `/${parentUrl}/${normalize(parentName)}-${normalize(subcategoryName)}/${subcategoryId}/s`,
        childs: []
      };
    });
};
