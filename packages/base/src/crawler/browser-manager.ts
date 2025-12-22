import { Browser, Page } from "puppeteer";
import { createPool, Pool } from "generic-pool";
import { getCrawlerClient } from "./client";
import { MAX_PAGE_NUM } from "../config";

class BrowserManager {
  private browser: Browser | null = null;
  private pagePool: Pool<Page>;

  constructor() {
    this.pagePool = this.createPagePool();
  }

  public async acquireBrowser() {
    if (!this.browser || !this.browser.connected) {
      const client = getCrawlerClient()
      this.browser = await client.launch();
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
        await page.close();
      },
    }, {
      max: MAX_PAGE_NUM,
      idleTimeoutMillis: 60000,
      acquireTimeoutMillis: 30000, // Wait max 30 seconds for a page
    });
  }

  public async acquirePage(): Promise<Page> {
    return await this.pagePool.acquire();
  }

  public async releasePage(page: Page) {
    await this.pagePool.destroy(page);
  }

  public async cleanUp() {
    if (!this.browser) return;

    await this.pagePool.drain();
    await this.pagePool.clear();
    await this.browser.close();
    this.browser = null;
  }
}

let browserManager: BrowserManager;
export const getBrowserManager = () => {
  if (!browserManager) browserManager = new BrowserManager();
  return browserManager;
};
