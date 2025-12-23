import { Browser } from 'puppeteer';
import { createPool, Pool } from 'generic-pool';
import { getCrawlerClient } from './client';
import { logger } from '../utils/logger';

export class BrowserPool {
  private pool: Pool<Browser>;

  constructor() {
    this.pool = createPool({
      create: async () => {
        logger.debug('Creating browser instance');
        const client = getCrawlerClient()
        const browser = await client.launch();
        return browser;
      },
      destroy: async (browser: Browser) => {
        logger.debug('Destroying browser instance');
        await browser.close();
      },
      validate: async (browser: Browser) => {
        return Promise.resolve(browser.connected);
      }
    }, {
      max: 4, // Número máximo de browsers no pool
      min: 1, // Número mínimo de browsers no pool
      idleTimeoutMillis: 3000000000, // Tempo de espera antes de destruir um browser ocioso
      acquireTimeoutMillis: 10000, // Tempo de espera para adquirir um browser do pool
    });
  }

  // Obtém uma instância do browser do pool
  public async acquireBrowser(): Promise<Browser> {
    logger.debug('Acquiring browser from pool');
    logger.debug({ available: this.pool.available, borrowed: this.pool.borrowed }, 'Pool stats');
    return await this.pool.acquire();
  }

  // Libera uma instância do browser de volta ao pool
  public async releaseBrowser(browser: Browser): Promise<void> {
    logger.debug('Releasing browser to pool');
    await this.pool.release(browser).catch(() => { });
  }

  // Fecha e limpa o pool
  public async drain(): Promise<void> {
    await this.pool.drain();
    await this.pool.clear();
  }
}

let pool: BrowserPool;
export const getBrowserPool = () => {
  if (!pool) pool = new BrowserPool();
  return pool;
};
