import { config } from 'dotenv';

config();
export const DIGITAL_OCEAN = {
  BUCKET_NAME: process.env.DIGITAL_OCEAN_BUCKET as string,
  ACCESS_KEY: process.env.DIGITAL_OCEAN_ACCESS_KEY,
  SECRET_KEY: process.env.DIGITAL_OCEAN_SECRET
};

export const MAX_PAGE_NUM = Number(process.env.MAX_PAGE_NUM) || 1;

// Timeout configurations (in milliseconds)
export const PAGE_NAVIGATION_TIMEOUT = Number(process.env.PAGE_NAVIGATION_TIMEOUT) || 60000;
export const PAGE_ACQUIRE_TIMEOUT = Number(process.env.PAGE_ACQUIRE_TIMEOUT) || 30000;
export const JOB_LOCK_DURATION = Number(process.env.JOB_LOCK_DURATION) || 300000; // 5 min
export const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 1;
