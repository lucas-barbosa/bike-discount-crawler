import { getByKey, saveByKey } from './utils';

const LOGIN_COLUMN_NAME = 'login_settings';
const DENIED_BRANDS_COLUMN_NAME = 'denied_brands';
const SELECTED_CATEGORIES_COLUMN_NAME = 'selected_categories';
const VIEWED_CATEGORIES_COLUMN_NAME = 'viewed_categories';
const CATEGORIES_DIMENSION_COLUMN_NAME = 'categories_dimension';
const CATEGORIES_TREE_COLUMN_NAME = 'categories_tree';
const CATEGORIES_WEIGHT_COLUMN_NAME = 'categories_weight';
const OVERRIDE_WEIGHT_CATEGORIES_COLUMN_NAME = 'override_weight_categories';

export const getCrawlerLogin = async () => {
  const login = await getByKey(LOGIN_COLUMN_NAME);
  if (!login) return null;

  const parsedLogin = JSON.parse(login);
  return {
    email: parsedLogin.email.toString(),
    password: parsedLogin.password.toString()
  };
};

export const getDeniedBrands = async () => {
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
  return [];
};

export const getCategoriesTree = async () => {
  const result = await getByKey(CATEGORIES_TREE_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return [];
};

export const getCategoriesWeight = async () => {
  const result = await getByKey(CATEGORIES_WEIGHT_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return [];
};

export const getOverrideWeightCategories = async () => {
  const result = await getByKey(OVERRIDE_WEIGHT_CATEGORIES_COLUMN_NAME);
  if (result) return JSON.parse(result);
  return [];
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
