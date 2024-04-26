import { getByKey, saveByKey } from './utils';

const LOGIN_COLUMN_NAME = 'login_settings';
const DENIED_BRANDS_COLUMN_NAME = 'denied_brands';
const SELECTED_CATEGORIES_COLUMN_NAME = 'selected_categories';
const VIEWED_CATEGORIES_COLUMN_NAME = 'viewed_categories';
const DEFAULT_WEIGHT_UNIT = 'default_weight_unit';
const MIN_PRICE_COLUMN_NAME = 'min_allowed_price';
const MAX_SIZE_COLUMN_NAME = 'max_allowed_size';
const MAX_WEIGHT_COLUMN_NAME = 'max_allowed_weight';
const CATEGORIES_DIMENSION_COLUMN_NAME = 'categories_dimension';
const CATEGORIES_TREE_COLUMN_NAME = 'categories_tree';
const CATEGORIES_WEIGHT_COLUMN_NAME = 'categories_weight';
const OVERRIDE_WEIGHT_CATEGORIES_COLUMN_NAME = 'override_weight_categories';
const WEIGHT_RULES_COLUMN_NAME = 'weight_rules';

export const getDefaultWeightUnit = async () => {
  const unit = await getByKey(DEFAULT_WEIGHT_UNIT) ?? '';
  if (['kg', 'g'].includes(unit)) return unit;
  return 'kg';
};

export const getCrawlerLogin = async () => {
  const login = await getByKey(LOGIN_COLUMN_NAME);
  if (!login) return null;

  const parsedLogin = JSON.parse(login);
  return {
    email: parsedLogin.email.toString(),
    password: parsedLogin.password.toString()
  };
};

export const getDeniedBrands = async (): Promise<string[]> => {
  const items = await getByKey(DENIED_BRANDS_COLUMN_NAME);
  if (!items) return [];
  return JSON.parse(items);
};

export const getSelectedCategories = async () => {
  const result = await getByKey(SELECTED_CATEGORIES_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return [];
};

export const getViewedCategories = async () => {
  const result = await getByKey(VIEWED_CATEGORIES_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return [];
};

export const getCategoriesDimension = async () => {
  const result = await getByKey(CATEGORIES_DIMENSION_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return {};
};

export const getCategoriesTree = async () => {
  const result = await getByKey(CATEGORIES_TREE_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return [];
};

export const getCategoriesWeight = async () => {
  const result = await getByKey(CATEGORIES_WEIGHT_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return {};
};

export const getOverrideWeightCategories = async (): Promise<string[]> => {
  const result = await getByKey(OVERRIDE_WEIGHT_CATEGORIES_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return [];
};

export const getWeightRules = async (): Promise<WeightRule[]> => {
  const result = await getByKey(WEIGHT_RULES_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return [];
};

export const getMinAllowedPrice = async () => {
  const result = await getByKey(MIN_PRICE_COLUMN_NAME);
  if (result) return Number(result);
  return 0;
};

export const getMaxAllowedSize = async () => {
  const result = await getByKey(MAX_SIZE_COLUMN_NAME);
  if (result) return Number(result);
  return 0;
};

export const getMaxAllowedWeight = async () => {
  const result = await getByKey(MAX_WEIGHT_COLUMN_NAME);
  if (result) return Number(result);
  return 0;
};

export const saveCrawlerLogin = async (email: string, password: string) => {
  await saveByKey(LOGIN_COLUMN_NAME, {
    email,
    password
  });
};

export const saveDeniedBrands = async (items: string[]) => {
  await saveByKey(DENIED_BRANDS_COLUMN_NAME, items);
};

export const saveSelectedCategories = async (items: string[]) => {
  await saveByKey(SELECTED_CATEGORIES_COLUMN_NAME, items);
};

export const saveViewedCategories = async (items: string[]) => {
  await saveByKey(VIEWED_CATEGORIES_COLUMN_NAME, items);
};

export const saveCategoriesDimension = async (items: string[]) => {
  await saveByKey(CATEGORIES_DIMENSION_COLUMN_NAME, items);
};

export const saveCategoriesTree = async (items: any[]) => {
  await saveByKey(CATEGORIES_TREE_COLUMN_NAME, items);
};

export const saveCategoriesWeight = async (items: any[]) => {
  await saveByKey(CATEGORIES_WEIGHT_COLUMN_NAME, items);
};

export const saveOverrideWeightCategories = async (items: any[]) => {
  await saveByKey(OVERRIDE_WEIGHT_CATEGORIES_COLUMN_NAME, items);
};
