import { type Product } from '@entities/Product';
import { type ProductVariation } from '@entities/ProductVariation';
import { convertDimensionToUnit, convertWeightToUnit } from '@utils/converters';
import { logger } from '@utils/logger';

type ValidateProductParams = {
  getDeniedBrands: () => Promise<string[]>;
  getMaxAllowedSize: () => Promise<number>;
  getMaxAllowedWeight: () => Promise<number>;
  getMinAllowedPrice: () => Promise<number>;
  getWeightRules: () => Promise<WeightRule[]>;
  getCategoriesDimension: () => Promise<Record<string, number>>;
  getCategoriesWeight: () => Promise<Record<string, number>>;
  getOverrideWeightCategories: () => Promise<any[]>;
};

export const useValidateProduct = (params: ValidateProductParams) => {
  const validateProduct = async (product: Product) => {
    await validateProductBrand(product);
    await validateProductDimensions(product);
  };

  const validateProductBrand = async (product: Product) => {
    if (!product.brand || product.invalid) {
      return;
    }

    const deniedBrands = await params.getDeniedBrands();
    if (!deniedBrands.length) {
      return;
    }

    const productBrand = product.brand.toLowerCase();
    if (deniedBrands.includes(productBrand)) {
      logger.info(`[INVALID] Product ${product.sku} - Brand '${product.brand}' is denied`);
      product.setInvalid();
    }
  };

  const validateProductDimensions = async (product: Product) => {
    if (product.invalid) {
      return;
    }

    const overrideWeight = await shouldOverrideWeight(product.categoryUrl);

    if (!product.weight?.value || overrideWeight) {
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
        logger.info(`[INVALID] Product ${product.sku} - Failed dimension/weight/price validation`);
        product.setInvalid();
      }

      return;
    }

    let valid = false;
    const variations = product.variations;

    for (const variation of variations) {
      const isValid = await checkIsValid(variation, weight.value, size.value, largestSide.value);
      if (!isValid) {
        logger.info(`[INVALID] Variation ${variation.id} of product ${product.sku} - Failed validation`);
        variation.setInvalid();
      } else {
        valid = true;
      }
    }

    if (!valid) {
      logger.info(`[INVALID] Product ${product.sku} - All variations are invalid`);
      product.setInvalid();
    }
  };

  const checkIsValid = async (product: Product | ProductVariation, weight: number, size: number, largestSide: number) => {
    const price = product.price;
    const MAX_ALLOWED_SIDE = await params.getMaxAllowedSize();
    const identifier = 'id' in product ? `variation ${product.id}` : `product ${(product as Product).sku}`;

    if (!price) {
      logger.info(`[VALIDATION] ${identifier} - No price`);
      return false;
    }

    if (largestSide > MAX_ALLOWED_SIDE) {
      logger.info(`[VALIDATION] ${identifier} - Largest side (${largestSide}cm) exceeds max allowed (${MAX_ALLOWED_SIDE}cm)`);
      return false;
    }

    if (!await validateMaxSize(size)) {
      logger.info(`[VALIDATION] ${identifier} - Size (${size}cm) exceeds max allowed`);
      return false;
    }

    if (!await validateMinPrice(price)) {
      logger.info(`[VALIDATION] ${identifier} - Price (${price}) below minimum allowed`);
      return false;
    }

    if (!weight) {
      return true;
    }

    if (!await validateMaxWeight(weight)) {
      logger.info(`[VALIDATION] ${identifier} - Weight (${weight}g) exceeds max allowed`);
      return false;
    }

    const weightValid = await validateWeight(price, weight, size);
    if (!weightValid) {
      logger.info(`[VALIDATION] ${identifier} - Failed weight rule validation (price: ${price}, weight: ${weight}g, size: ${size}cm)`);
    }
    return weightValid;
  };

  const validateMaxSize = async (productSize: number) => {
    const MAX_ALLOWED_SIZE = await params.getMaxAllowedSize();

    if (!productSize || !MAX_ALLOWED_SIZE) {
      return true;
    }

    return MAX_ALLOWED_SIZE >= productSize;
  };

  const validateMaxWeight = async (productWeight: number) => {
    const MAX_ALLOWED_WEIGHT = await params.getMaxAllowedWeight();

    if (!MAX_ALLOWED_WEIGHT || isNaN(MAX_ALLOWED_WEIGHT)) {
      return true;
    }

    return MAX_ALLOWED_WEIGHT >= productWeight;
  };

  const validateMinPrice = async (price: number) => {
    const MIN_PRICE = await params.getMinAllowedPrice();

    if (!price || isNaN(price) || !MIN_PRICE || isNaN(MIN_PRICE)) {
      return true;
    }

    return price > MIN_PRICE;
  };

  const validateWeight = async (productPrice: number, productWeight: number, productSize: number) => {
    const weightRules = await params.getWeightRules();

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
    const values = await params.getCategoriesDimension();
    if (!values) return 0;
    return values[categoryUrl] ?? 0;
  };

  const getDefaultCategoryWeight = async (categoryUrl: string) => {
    const values = await params.getCategoriesWeight();
    if (!values) return 0;
    return values[categoryUrl] ?? 0;
  };

  const shouldOverrideWeight = async (categoryUrl: string) => {
    const categories = await params.getOverrideWeightCategories().catch(() => [] as string[]);
    return categories.includes(categoryUrl);
  };

  return validateProduct;
};
