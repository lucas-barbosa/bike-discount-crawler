import { Browser, Page } from "puppeteer";
import { createPool, Pool } from "generic-pool";
import { getCrawlerClient } from "./client";
import { MAX_PAGE_NUM } from "../config";
import { logger } from "../utils/logger";

const BROWSER_MAX_PAGES = Number(process.env.BROWSER_MAX_PAGES) || 100;

class BrowserManager {
  private browser: Browser | null = null;
  private pagePool: Pool<Page>;
  private pageCount = 0;

  constructor() {
    this.pagePool = this.createPagePool();
  }

  public async acquireBrowser() {
    if (!this.browser || !this.browser.connected) {
      const client = getCrawlerClient()
      this.browser = await client.launch();
      this.pageCount = 0;
    }

    return this.browser;
  }

  private createPagePool(): Pool<Page> {
    return createPool({
      create: async () => {
        const browser = await this.acquireBrowser();
        const page = await browser!.newPage();
        return page;
      },
      destroy: async (page: Page) => {
        try { await page.close(); } catch { }
      },
    }, {
      max: MAX_PAGE_NUM,
      idleTimeoutMillis: 60000,
      acquireTimeoutMillis: 30000,
    });
  }

  public async acquirePage(): Promise<Page> {
    // Recycle browser after threshold to prevent memory accumulation
    if (this.pageCount >= BROWSER_MAX_PAGES && this.browser) {
      logger.info({ pageCount: this.pageCount }, 'Recycling browser after page threshold');
      await this.cleanUp();
      this.pagePool = this.createPagePool();
    }

    this.pageCount++;
    return await this.pagePool.acquire();
  }

  public async releasePage(page: Page) {
    try {
      if (page.isClosed()) {
        await this.pagePool.destroy(page);
        return;
      }

      // Clear page state before returning to pool
      await page.goto('about:blank').catch(() => { });
      await this.pagePool.release(page);
    } catch {
      // Page is broken — destroy it so the pool creates a fresh one
      await this.pagePool.destroy(page).catch(() => { });
    }
  }

  public async cleanUp() {
    if (!this.browser) return;

    await this.pagePool.drain();
    await this.pagePool.clear();
    try { await this.browser.close(); } catch { }
    this.browser = null;
    this.pageCount = 0;
  }
}

let browserManager: BrowserManager;
export const getBrowserManager = () => {
  if (!browserManager) browserManager = new BrowserManager();
  return browserManager;
};
