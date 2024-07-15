import { type CategoryDimension } from '../types/CategoryDimension';
import { type CategoryWeight } from '../types/CategoryWeight';
import { getRedis } from './utils';

const LOGIN_COLUMN_NAME = 'login_settings';
const DENIED_BRANDS_COLUMN_NAME = 'denied_brands';
const SELECTED_CATEGORIES_COLUMN_NAME = 'selected_categories';
const DEFAULT_WEIGHT_UNIT = 'default_weight_unit';
const MIN_PRICE_COLUMN_NAME = 'min_allowed_price';
const MAX_SIZE_COLUMN_NAME = 'max_allowed_size';
const MAX_WEIGHT_COLUMN_NAME = 'max_allowed_weight';
const CATEGORIES_DIMENSION_COLUMN_NAME = 'categories_dimension';
const CATEGORIES_WEIGHT_COLUMN_NAME = 'categories_weight';
const OVERRIDE_WEIGHT_CATEGORIES_COLUMN_NAME = 'override_weight_categories';
const WEIGHT_RULES_COLUMN_NAME = 'weight_rules';

export const crawlerSettings = (crawlerId: string) => {
  const { getByKey, saveByKey} = getRedis(crawlerId);

  const getDefaultWeightUnit = async () => {
    const unit = await getByKey(DEFAULT_WEIGHT_UNIT) ?? '';
    if (['kg', 'g'].includes(unit)) return unit;
    return 'kg';
  };

  const getCrawlerLogin = async () => {
    const login = await getByKey(LOGIN_COLUMN_NAME);
    if (!login) return null;

    const parsedLogin = JSON.parse(login);
    return {
      email: parsedLogin.email.toString(),
      password: parsedLogin.password.toString()
    };
  };

  const getDeniedBrands = async (): Promise<string[]> => {
    const items = await getByKey(DENIED_BRANDS_COLUMN_NAME);
    if (!items) return [];
    return JSON.parse(items);
  };

  const getSelectedCategories = async () => {
    const result = await getByKey(SELECTED_CATEGORIES_COLUMN_NAME);
    if (result) return JSON.parse(result);
    return [];
  };

  const getCategoriesDimension = async () => {
    const result = await getByKey(CATEGORIES_DIMENSION_COLUMN_NAME);
    if (result) return JSON.parse(result);
    return {};
  };

  const getCategoriesWeight = async () => {
    const result = await getByKey(CATEGORIES_WEIGHT_COLUMN_NAME);
    if (result) return JSON.parse(result);
    return {};
  };

  const getOverrideWeightCategories = async (): Promise<string[]> => {
    const result = await getByKey(OVERRIDE_WEIGHT_CATEGORIES_COLUMN_NAME);
    if (result) return JSON.parse(result);
    return [];
  };

  const getWeightRules = async (): Promise<WeightRule[]> => {
    const result = await getByKey(WEIGHT_RULES_COLUMN_NAME);
    if (result) return JSON.parse(result);
    return [];
  };

  const getMinAllowedPrice = async () => {
    const result = await getByKey(MIN_PRICE_COLUMN_NAME);
    if (result) return Number(result);
    return 0;
  };

  const getMaxAllowedSize = async () => {
    const result = await getByKey(MAX_SIZE_COLUMN_NAME);
    if (result) return Number(result);
    return 0;
  };

  const getMaxAllowedWeight = async () => {
    const result = await getByKey(MAX_WEIGHT_COLUMN_NAME);
    if (result) return Number(result);
    return 0;
  };

  const saveCrawlerLogin = async (email: string, password: string) => {
    await saveByKey(LOGIN_COLUMN_NAME, JSON.stringify({
      email,
      password
    }));
  };

  const saveDeniedBrands = async (items: string[]) => {
    await saveByKey(DENIED_BRANDS_COLUMN_NAME, JSON.stringify(items));
  };

  const saveSelectedCategories = async (items: string[]) => {
    await saveByKey(SELECTED_CATEGORIES_COLUMN_NAME, JSON.stringify(items));
  };

  const saveCategoriesDimension = async (items: CategoryDimension[]) => {
    await saveByKey(CATEGORIES_DIMENSION_COLUMN_NAME, JSON.stringify(items));
  };

  const saveCategoriesWeight = async (items: CategoryWeight[]) => {
    await saveByKey(CATEGORIES_WEIGHT_COLUMN_NAME, JSON.stringify(items));
  };

  const saveOverrideWeightCategories = async (items: string[]) => {
    await saveByKey(OVERRIDE_WEIGHT_CATEGORIES_COLUMN_NAME, JSON.stringify(items));
  };

  const saveWeightRules = async (items: WeightRule[]) => {
    await saveByKey(WEIGHT_RULES_COLUMN_NAME, JSON.stringify(items));
  };

  const saveMinAllowedPrice = async (value: any) => {
    await saveByKey(MIN_PRICE_COLUMN_NAME, value ?? 0);
  };

  const saveMaxAllowedSize = async (value: any) => {
    await saveByKey(MAX_SIZE_COLUMN_NAME, value ?? 0);
  };

  const saveMaxAllowedWeight = async (value: any) => {
    await saveByKey(MAX_WEIGHT_COLUMN_NAME, value ?? 0);
  };

  return {
    getDefaultWeightUnit,
    getCrawlerLogin,
    getDeniedBrands,
    getSelectedCategories,
    getCategoriesDimension,
    getCategoriesWeight,
    getOverrideWeightCategories,
    getWeightRules,
    getMinAllowedPrice,
    getMaxAllowedSize,
    getMaxAllowedWeight,
    saveCrawlerLogin,
    saveDeniedBrands,
    saveSelectedCategories,
    saveCategoriesDimension,
    saveCategoriesWeight,
    saveOverrideWeightCategories,
    saveWeightRules,
    saveMinAllowedPrice,
    saveMaxAllowedSize,
    saveMaxAllowedWeight
  };
}
