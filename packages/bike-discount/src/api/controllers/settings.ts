import { type Request, type Response } from 'express';
import {
  getCategoriesDimension,
  getCategoriesWeight,
  getDeniedBrands,
  getOverrideWeightCategories,
  getSelectedCategories,
  getWeightRules,
  saveCategoriesDimension,
  saveCategoriesWeight,
  saveDeniedBrands,
  saveMaxAllowedSize,
  saveMaxAllowedWeight,
  saveMinAllowedPrice,
  saveOverrideWeightCategories,
  saveSelectedCategories,
  saveWeightRules
} from '@infrastructure/crawler-settings';
import { enqueueSelectedCategories } from '@usecases/enqueue-selected-categories';

export const listDeniedBrands = async (req: Request, res: Response) => {
  const items = await getDeniedBrands();
  return res.json({ items });
};

export const listSelectedCategories = async (req: Request, res: Response) => {
  const data = await getSelectedCategories();
  return res.json({ data });
};

export const listCategoriesDimension = async (req: Request, res: Response) => {
  const data = await getCategoriesDimension();
  return res.json({ data });
};

export const listCategoriesWeight = async (req: Request, res: Response) => {
  const data = await getCategoriesWeight();
  return res.json({ data });
};

export const listOverriedWeightCategories = async (req: Request, res: Response) => {
  const data = await getOverrideWeightCategories();
  return res.json({ data });
};

export const listWeightRules = async (req: Request, res: Response) => {
  const data = await getWeightRules();
  return res.json({ data });
};

export const storeDeniedBrands = async (req: Request, res: Response) => {
  const { body } = req;

  let items = body.data ?? [];
  if (typeof items === 'string') items = items.split(/\r\n|[\r\n]/);
  items = items.map((brand: string) => brand.toLowerCase());

  await saveDeniedBrands(items);

  return res.status(200).json({ items });
};

export const storeSelectedCategories = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.data ?? [];
  await saveSelectedCategories(categories);
  await enqueueSelectedCategories();

  return res.status(200).json({ categories });
};

export const storeCategoriesDimension = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.data ?? [];
  await saveCategoriesDimension(categories);

  return res.status(200).json({ categories });
};

export const storeCategoriesWeight = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.data ?? [];
  await saveCategoriesWeight(categories);

  return res.status(200).json({ categories });
};

export const storeWeightRules = async (req: Request, res: Response) => {
  const { body } = req;

  const requestData = body.data ?? {};
  const { min, maxWeight, maxSize, data } = requestData;

  await saveMinAllowedPrice(min);
  await saveMaxAllowedSize(maxSize);
  await saveMaxAllowedWeight(maxWeight);
  await saveWeightRules(data.map((x: any): WeightRule => ({
    minPrice: x.min_price,
    minWeight: x.min_weight,
    maxWeight: x.max_weight,
    maxSize: x.max_size
  })));

  return res.status(200).json({ data });
};

export const storeOverriedWeightCategories = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.data ?? [];
  await saveOverrideWeightCategories(categories);

  return res.status(200).json({ categories });
};
