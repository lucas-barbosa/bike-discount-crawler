import { getCategoriesDimension, getCategoriesWeight, getDeniedBrands, getMaxAllowedSize, getMaxAllowedWeight, getMinAllowedPrice, getOverrideWeightCategories, getWeightRules } from '@infrastructure/crawler-settings';
import { type Product } from '@entities/Product';
import { type ProductVariation } from '@entities/ProductVariation';
import { convertDimensionToUnit, convertWeightToUnit } from '@crawlers/base/dist/utils/converters';

// TODO: replace with useValidateProduct
export const validateProduct = async (product: Product) => {
  await validateProductBrand(product);
  await validateProductDimensions(product);
};

const validateProductBrand = async (product: Product) => {
  if (!product.brand || product.invalid) {
    return;
  }

  const deniedBrands = await getDeniedBrands();
  if (!deniedBrands.length) {
    return;
  }

  const productBrand = product.brand.toLowerCase();
  if (deniedBrands.includes(productBrand)) {
    product.setInvalid();
  }
};

const validateProductDimensions = async (product: Product) => {
  if (product.invalid) {
    return;
  }

  const overrideWeight = await shouldOverrideWeight(product.categoryUrl);

  if (!product.weight || overrideWeight) {
    const weightValue = await getDefaultCategoryWeight(product.categoryUrl);
    product.weight = {
      unit: 'g',
      value: Number(weightValue)
    };
  }

  const weight = {
    ...product.weight,
    value: convertWeightToUnit(product.weight.value, product.weight.unit as any, 'g')
  };

  const size = product.getSize();
  if (!size.value || overrideWeight) {
    size.value = Number(await getDefaultCategorySize(product.categoryUrl));
  }
  size.value = convertDimensionToUnit(size.value, size.unit as any || 'cm', 'cm');

  const largestSide = product.getLargestSide();
  largestSide.value = convertDimensionToUnit(largestSide.value, largestSide.unit as any || 'cm', 'cm');

  if (!product.isVariable) {
    const isValid = await checkIsValid(product, weight.value, size.value, largestSide.value);

    if (!isValid) {
      product.setInvalid();
    }

    return;
  }

  let valid = false;
  const variations = product.variations;

  for (const variation of variations) {
    const isValid = await checkIsValid(variation, weight.value, size.value, largestSide.value);
    if (!isValid) {
      variation.setInvalid();
    } else {
      valid = true;
    }
  }

  if (!valid) {
    product.setInvalid();
  }
};

const checkIsValid = async (product: Product | ProductVariation, weight: number, size: number, largestSide: number) => {
  const price = product.price;
  const MAX_ALLOWED_SIDE = await getMaxAllowedSize();

  if (!price) {
    return false;
  }

  if (largestSide > MAX_ALLOWED_SIDE) {
    return false;
  }

  if (!await validateMaxSize(size)) {
    return false;
  }

  if (!await validateMinPrice(price)) {
    return false;
  }

  if (!weight) {
    return true;
  }

  if (!await validateMaxWeight(weight)) {
    return false;
  }

  return validateWeight(price, weight, size);
};

const validateMaxSize = async (productSize: number) => {
  const MAX_ALLOWED_SIZE = await getMaxAllowedSize();

  if (!productSize || !MAX_ALLOWED_SIZE) {
    return true;
  }

  return MAX_ALLOWED_SIZE >= productSize;
};

const validateMaxWeight = async (productWeight: number) => {
  const MAX_ALLOWED_WEIGHT = await getMaxAllowedWeight();

  if (!MAX_ALLOWED_WEIGHT || isNaN(MAX_ALLOWED_WEIGHT)) {
    return true;
  }

  return MAX_ALLOWED_WEIGHT >= productWeight;
};

const validateMinPrice = async (price: number) => {
  const MIN_PRICE = await getMinAllowedPrice();

  if (!price || isNaN(price) || !MIN_PRICE || isNaN(MIN_PRICE)) {
    return true;
  }

  return price > MIN_PRICE;
};

const validateWeight = async (productPrice: number, productWeight: number, productSize: number) => {
  const weightRules = await getWeightRules();

  if (!weightRules?.length) {
    return true;
  }

  let productWeightIsAllowed = false;

  for (const rule of weightRules) {
    if (productWeightIsAllowed && rule.maxSize && Number(rule.maxSize) >= productSize) {
      return productPrice >= Number(rule.minPrice);
    }

    if (productWeight >= Number(rule.minWeight) && (!rule.maxWeight || productWeight <= Number(rule.maxWeight))) {
      if (!rule.maxSize || Number(rule.maxSize) >= productSize) {
        return productPrice >= Number(rule.minPrice);
      }

      productWeightIsAllowed = true;
    }
  }

  return false;
};

const getDefaultCategorySize = async (categoryUrl: string) => {
  const values = await getCategoriesDimension();
  if (!values) return 0;
  return values[categoryUrl] ?? 0;
};

const getDefaultCategoryWeight = async (categoryUrl: string) => {
  const values = await getCategoriesWeight();
  if (!values) return 0;
  return values[categoryUrl] ?? 0;
};

const shouldOverrideWeight = async (categoryUrl: string) => {
  const categories = await getOverrideWeightCategories().catch(() => [] as string[]);
  return categories.includes(categoryUrl);
};
