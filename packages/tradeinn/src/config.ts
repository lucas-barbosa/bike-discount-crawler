import { config } from 'dotenv';

config();
export const TRADEINN_PRICE_MULTIPLICATOR = Number(process.env.TRADEINN_PRICE_MULTIPLICATOR ?? 1);
export const COUNTRY_PORTUGAL_ID = 159;
