import axios from 'axios';
import { COUNTRY_PORTUGAL_ID } from '../../config';

export interface TradeInnStoredAttribute {
  nombre_atributo: string
  operador: string
  prioridad: string
  valores: Record<string, string>
}

export interface TradeInnCategoryInfo {
  subfamilias: Record<string, {
    list_atr: string
  }>
}

export type TradeInnAtributtesDictionary = Record<string, TradeInnStoredAttribute>;

export type TradeInnCategoriesInfoDictionary = Record<string, TradeInnCategoryInfo>;

export interface TradeInnStoreData { categories: TradeInnCategoriesInfoDictionary, attributes: TradeInnAtributtesDictionary };

/**
 * Fetches the store info from TradeInn source
 */
export async function getStoreInfo (
  storeId: string
): Promise<TradeInnStoreData> {
  const { data } = await axios.get(`https://www.tradeinn.com/get_dades.php?id_tienda=${storeId}&idioma=por&id_pais=${COUNTRY_PORTUGAL_ID}&country_code_url=`);

  return {
    attributes: data.atributos || {},
    categories: data.categorias || {}
  };
}
