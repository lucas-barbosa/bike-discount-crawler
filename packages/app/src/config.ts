/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { config } from 'dotenv';

config();
export const AUTH = {
  secret: process.env.AUTH_SECRET!,
  username: process.env.AUTH_USERNAME!,
  password: process.env.AUTH_PASSWORD!
};
