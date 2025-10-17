import axios from 'axios';
import { RateLimit } from 'async-sema';

import { getRequestBody } from '@crawler/utils/list-products-request-body';
import { extractAttributes, type TradeInnAttribute } from '@crawler/utils/extract-attributes';
import { getCachedStoreInfoDictionary, setCachedStoreInfoDictionary } from '@crawler/utils/store-info-cache';
import { getStoreInfo, type TradeInnStoreData } from '@crawler/utils/get-store-info';

const limiter = RateLimit(1, { timeUnit: 1_500 }); // 1 request per 1.5 sec

/**
 * Main method used to list available attributes for a given category.
 */
export const listAttributes = async (
  storeId: string,
  parentId: string,
  categoryId: string,
  categoryUrl: string
): Promise<TradeInnAttribute[]> => {
  await limiter();
  const data = await request(parentId, categoryId, categoryUrl);

  // Cache key
  const cacheKey = `store_info_${storeId}`;

  // Check cache first
  let storeInfo: TradeInnStoreData = getCachedStoreInfoDictionary(cacheKey) ?? { categories: {}, attributes: {} };

  if (!storeInfo || !Object.keys(storeInfo?.attributes).length) {
    storeInfo = await getStoreInfo(storeId);
    setCachedStoreInfoDictionary(cacheKey, storeInfo);
  }

  const supportedAttributes = storeInfo.categories[parentId]?.subfamilias?.[categoryId]?.list_atr?.split(',') || [];

  // Extract attributes
  const attributes = extractAttributes(data, storeInfo?.attributes);
  return attributes.map((item) => ({
    id: String(item.id_atributo),
    label: String(item.nombre_atributo),
    values: item.valores.filter(x => x.doc_count > 0).map((value: any) => ({
      id: String(value.id_atributo_valor),
      name: value.nombre_id_atributo_valor
    }))
  }))
    .filter(x => !['cor', 'subcategorias', 'categorias'].includes(x.label.toLowerCase()))
    .filter(x => x.values.length > 1)
    .filter(x => supportedAttributes.includes(x.id));
};

const request = async (parentId: string, categoryId: string, categoryUrl: string) => {
  const body = getRequestBody(1, parentId, categoryId, true);

  const { data } = await axios.post('https://sr.tradeinn.com/', body, {
    headers: {
      referer: categoryUrl,
      origin: 'https://www.tradeinn.com',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    }
  });
  return data.aggregations || {};
};
