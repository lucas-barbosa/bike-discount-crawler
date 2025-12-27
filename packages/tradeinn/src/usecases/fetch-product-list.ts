import { listProducts } from '@crawler/actions/list-products';
import { logger } from '@crawlers/base';
import { type CategorySearch } from '@crawlers/base/dist/types/CategorySearch';

export const fetchProductList = async (categoryUrl: string, page: number = 1) => {
  const params = getParamsFromUrl(categoryUrl);

  if (!params) {
    return null;
  }

  return listProducts(params.parentId, params.categoryId, categoryUrl, params.attributeId, page)
  // Add timeout to avoid being detected by rate limit
    .then(res => new Promise<CategorySearch>(resolve => setTimeout(resolve, Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000, res)))
    .catch(err => {
      logger.warn({ err }, 'Error fetching product list');
      return null;
    });
};

const getParamsFromUrl = (url: string) => {
  const urlObj = new URL(url);
  const parentId = urlObj.searchParams.get('parentId');
  let categoryId = urlObj.searchParams.get('categoryId');

  if (parentId === null || categoryId === null) {
    return null;
  }

  let attributeId: string | undefined;

  // Check if categoryId has pipe-separated format first
  // Pattern: categoryId=X|Y|Z where X is the real categoryId and Z is the attributeId
  const categoryParts = categoryId.split('|');
  if (categoryParts.length === 3) {
    categoryId = categoryParts[0]; // First number is the real categoryId
    attributeId = categoryParts[2]; // Last number is the attributeId
  }

  // Extract attributeId from hash fragment if present (overrides pipe format)
  // Pattern: atributos=X_Y_Z where Y is the attributeId
  const hash = urlObj.hash;
  if (hash) {
    const atributosMatch = hash.match(/atributos=(\d+)_(\d+)_(\d+)/);
    if (atributosMatch) {
      attributeId = atributosMatch[2]; // Second number is the attributeId
    }
  }

  return { parentId, categoryId, attributeId };
};
