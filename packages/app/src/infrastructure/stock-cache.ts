import { type ProductStock } from '@crawlers/bike-discount/src/types/ProductStock';
import { getByKey, saveByKey } from './redis';

const COLUMN_NAME = 'stock-cache';

const getColumName = (id: string, crawlerId: string) => `${COLUMN_NAME}_${id}_${crawlerId}`;

export const addStockToCache = async (stock: ProductStock) => {
  await saveByKey(getColumName(stock.id, stock.crawlerId), JSON.stringify(stock));
};

export const retrieveStockFromCache = async (id: string, crawlerId: string) => {
  const result = await getByKey(getColumName(id, crawlerId));
  if (result) return JSON.parse(result) as ProductStock;
  return null;
};

export const hasStockChanged = async (stock: ProductStock) => {
  const existingCache = await retrieveStockFromCache(stock.id, stock.crawlerId);
  if (!existingCache) return true;
  return !isCachedStockUpdated(stock, existingCache);
};

const isCachedStockUpdated = (currentStock: ProductStock, cachedStock: ProductStock) => {
  if (currentStock.id !== cachedStock.id ||
    currentStock.price !== cachedStock.price ||
    currentStock.availability !== cachedStock.availability ||
    currentStock.variations?.length !== cachedStock.variations?.length) {
    return false;
  }

  // Create a map for the current stock variations
  const currentVariationsMap = new Map(
    currentStock.variations.map(variation => [variation.id, `${variation.price}-${variation.availability}`])
  );

  // Iterate through the cached stock variations and compare with the current stock variations
  for (const cachedVariation of cachedStock.variations) {
    const currentVariation = currentVariationsMap.get(cachedVariation.id);
    if (!currentVariation || currentVariation !== `${cachedVariation.price}-${cachedVariation.availability}`) {
      return false;
    }
  }

  return true;
};
