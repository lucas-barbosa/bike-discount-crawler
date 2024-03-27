import { type Request, type Response } from 'express';
import { getCategoriesDimension, getCategoriesTree, getCategoriesWeight, getDeniedBrands, getOverrideWeightCategories, getSelectedCategories, getViewedCategories, saveCategoriesDimension, saveCategoriesTree, saveCategoriesWeight, saveDeniedBrands, saveOverrideWeightCategories, saveSelectedCategories, saveViewedCategories } from '@infrastructure/crawler-settings';

export const listDeniedBrands = async (req: Request, res: Response) => {
  const items = await getDeniedBrands();
  return res.json({ items });
};

export const listSelectedCategories = async (req: Request, res: Response) => {
  const data = await getSelectedCategories();
  return res.json({ data });
};

export const listViewedCategories = async (req: Request, res: Response) => {
  const data = await getViewedCategories();
  return res.json({ data });
};

export const listCategoriesDimension = async (req: Request, res: Response) => {
  const data = await getCategoriesDimension();
  return res.json({ data });
};

export const listCategoriesTree = async (req: Request, res: Response) => {
  const data = await getCategoriesTree();
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

export const storeDeniedBrands = async (req: Request, res: Response) => {
  const { body } = req;

  const items = body.items ?? [];
  await saveDeniedBrands(items);

  return res.status(200).json({ items });
};

export const storeSelectedCategories = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.categories ?? [];
  await saveSelectedCategories(categories);

  return res.status(200).json({ categories });
};

export const storeViewedCategories = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.categories ?? [];
  await saveViewedCategories(categories);

  return res.status(200).json({ categories });
};

export const storeCategoriesDimension = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.categories ?? [];
  await saveCategoriesDimension(categories);

  return res.status(200).json({ categories });
};

export const storeCategoriesTree = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.categories ?? [];
  await saveCategoriesTree(categories);

  return res.status(200).json({ categories });
};

export const storeCategoriesWeight = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.categories ?? [];
  await saveCategoriesWeight(categories);

  return res.status(200).json({ categories });
};

export const storeOverriedWeightCategories = async (req: Request, res: Response) => {
  const { body } = req;

  const categories = body.categories ?? [];
  await saveOverrideWeightCategories(categories);

  return res.status(200).json({ categories });
};
