import { type ProductStock } from '@crawlers/base/dist/types/ProductStock';
import { type OldStockResult } from '@crawlers/bike-discount/src/queue/old-stock';
import { getByKey, saveByKey, deleteByKey } from './redis';

const COLUMN_NAME = 'stock-cache';

const getColumName = (id: string, crawlerId: string) => `${COLUMN_NAME}_${id}_${crawlerId}`;

const getStockId = (stock: ProductStock) => {
  return (stock.id || stock.url) ?? '';
};

export const addStockToCache = async (stock: ProductStock) => {
  await saveByKey(getColumName(getStockId(stock), stock.crawlerId), JSON.stringify(stock));
};

export const deleteStockCache = async (id: string, crawlerId: string) => deleteByKey(getColumName(id, crawlerId));

export const addOldStockToCache = async ({ items }: OldStockResult) => {
  await Promise.all(items.map(stock => saveByKey(getColumName(stock.id, stock.crawlerId), JSON.stringify(stock))));
};

export const retrieveStockFromCache = async (id: string, crawlerId: string) => {
  const result = await getByKey(getColumName(id, crawlerId));
  if (result) return JSON.parse(result) as ProductStock;
  return null;
};

export const hasStockChanged = async (stock: ProductStock) => {
  const existingCache = await retrieveStockFromCache(getStockId(stock), stock.crawlerId);
  if (!existingCache) return true;
  return isCachedStockUpdated(stock, existingCache);
};

export const hasOldStockChanged = async ({ items }: OldStockResult) => {
  for (const stock of items) {
    const existingCache = await retrieveStockFromCache(getStockId(stock), stock.crawlerId);
    if (!existingCache) return true;

    const isUpdated = isCachedStockUpdated(stock, existingCache);
    if (isUpdated) return true;
  }
  return false;
};

const isCachedStockUpdated = (currentStock: ProductStock, cachedStock: ProductStock) => {
  if (getStockId(currentStock) !== getStockId(cachedStock) ||
    currentStock.price !== cachedStock.price ||
    currentStock.availability !== cachedStock.availability ||
    currentStock.variations?.length !== cachedStock.variations?.length) {
    return true;
  }

  // Create a map for the current stock variations
  const currentVariationsMap = new Map(
    currentStock.variations.map(variation => [variation.id, `${variation.price}-${variation.availability}`])
  );

  // Iterate through the cached stock variations and compare with the current stock variations
  for (const cachedVariation of cachedStock.variations) {
    const currentVariation = currentVariationsMap.get(cachedVariation.id);
    if (!currentVariation || currentVariation !== `${cachedVariation.price}-${cachedVariation.availability}`) {
      return true;
    }
  }

  return false;
};
