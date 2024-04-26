import puppeteer from 'puppeteer';
import { type PuppeteerExtra, addExtra } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

let client: PuppeteerExtra;
export const getCrawlerClient = () => {
  if (!client) client = addExtra(puppeteer).use(StealthPlugin());
  return client;
};
