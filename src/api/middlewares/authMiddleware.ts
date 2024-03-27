import { getApiKeys } from '@infrastructure/auth';
import { type NextFunction, type Request, type Response } from 'express';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const apiKey: string | undefined = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ message: 'API Key missing' });
  }

  const existingKeys: string[] = await getApiKeys();
  if (!existingKeys.includes(apiKey)) {
    return res.status(401).json({ message: 'API Key invalid' });
  }

  next();
};
