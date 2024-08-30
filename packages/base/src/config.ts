import { config } from 'dotenv';

config();
export const DIGITAL_OCEAN = {
  BUCKET_NAME: process.env.DIGITAL_OCEAN_BUCKET as string,
  ACCESS_KEY: process.env.DIGITAL_OCEAN_ACCESS_KEY,
  SECRET_KEY: process.env.DIGITAL_OCEAN_SECRET
};

export const MAX_PAGE_NUM = Number(process.env.MAX_PAGE_NUM) || 1;
