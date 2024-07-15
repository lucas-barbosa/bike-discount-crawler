import { crawlerSettings as baseCrawlerSettings } from '@crawlers/base/dist/infrastructure/crawler-settings';
import { COLUMN_PREFIX } from './utils';

export const crawlerSettings = baseCrawlerSettings(COLUMN_PREFIX);
