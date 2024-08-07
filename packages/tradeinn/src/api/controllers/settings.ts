import { type Request, type Response } from 'express';
import { crawlerSettings } from '@infrastructure/crawler-settings';
// import { enqueueSelectedCategories } from '@usecases/enqueue-selected-categories';

export const listDeniedBrands = async (req: Request, res: Response) => {
  const items = await crawlerSettings.getDeniedBrands();
  return res.json({ items });
};

export const listSelectedCategories = async (req: Request, res: Response) => {
  const data = await crawlerSettings.getSelectedCategories();
  return res.json({ data });
};

export const listCategoriesDimension = async (req: Request, res: Response) => {
  const data = await crawlerSettings.getCategoriesDimension();
  return res.json({ data });
};

export const listCategoriesWeight = async (req: Request, res: Response) => {
  const data = await crawlerSettings.getCategoriesWeight();
  return res.json({ data });
};

export const listOverriedWeightCategories = async (req: Request, res: Response) => {
  const data = await crawlerSettings.getOverrideWeightCategories();
  return res.json({ data });
};

export const listWeightRules = async (req: Request, res: Response) => {
  const data = await crawlerSettings.getWeightRules();
  return res.json({ data });
};

export const storeDeniedBrands = async (req: Request, res: Response) => {
  const { body } = req;

  let items = body.data ?? [];
  if (typeof items === 'string') items = items.split(/\r\n|[\r\n]/);
  items = items.map((brand: string) => brand.toLowerCase());

  await crawlerSettings.saveDeniedBrands(items);

  return res.status(200).json({ items });
};

export const storeSelectedCategories = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.data ?? [];
  await crawlerSettings.saveSelectedCategories(categories);
  // await enqueueSelectedCategories();

  return res.status(200).json({ categories });
};

export const storeCategoriesDimension = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.data ?? [];
  await crawlerSettings.saveCategoriesDimension(categories);

  return res.status(200).json({ categories });
};

export const storeCategoriesWeight = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.data ?? [];
  await crawlerSettings.saveCategoriesWeight(categories);

  return res.status(200).json({ categories });
};

export const storeWeightRules = async (req: Request, res: Response) => {
  const { body } = req;

  const requestData = body.data ?? {};
  const { min, maxWeight, maxSize, data } = requestData;

  await crawlerSettings.saveMinAllowedPrice(min);
  await crawlerSettings.saveMaxAllowedSize(maxSize);
  await crawlerSettings.saveMaxAllowedWeight(maxWeight);
  await crawlerSettings.saveWeightRules(data.map((x: any): any => ({
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
  await crawlerSettings.saveOverrideWeightCategories(categories);

  return res.status(200).json({ categories });
};
