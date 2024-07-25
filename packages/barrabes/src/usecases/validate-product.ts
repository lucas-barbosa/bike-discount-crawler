import { useValidateProduct } from '@crawlers/base/dist/usecases/validate-product';
import { type Product } from '@crawlers/base/dist/types/Product';
import { crawlerSettings } from '@infrastructure/crawler-settings';

export const validateProduct = async (product: Product) => {
  const validate = useValidateProduct({
    getDeniedBrands: crawlerSettings.getDeniedBrands,
    getMaxAllowedSize: crawlerSettings.getMaxAllowedSize,
    getMaxAllowedWeight: crawlerSettings.getMaxAllowedWeight,
    getMinAllowedPrice: crawlerSettings.getMinAllowedPrice,
    getWeightRules: crawlerSettings.getWeightRules,
    getCategoriesDimension: crawlerSettings.getCategoriesDimension,
    getCategoriesWeight: crawlerSettings.getCategoriesWeight,
    getOverrideWeightCategories: crawlerSettings.getOverrideWeightCategories
  });
  await validate(product);
};
