import { config } from 'dotenv';

config();
export const BARRABES_PRICE_MULTIPLICATOR = Number(process.env.BARRABES_PRICE_MULTIPLICATOR ?? 1);
