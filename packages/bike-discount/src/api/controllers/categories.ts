import { type Request, type Response } from 'express';
import { enqueueCategories as queueInit } from '../../queue/categories';

export const enqueueCategories = async (req: Request, res: Response) => {
  await queueInit();
  return res.send();
};
