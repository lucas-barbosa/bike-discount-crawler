import { Browser } from "puppeteer";
import { getCrawlerClient } from "./client";

class BrowserManager {
  private browser: Browser | null = null;
  private readonly inactivityTimeout: number = 30000;

  public async acquireBrowser() {
    if (!this.browser || !this.browser.connected) {
      const client = getCrawlerClient()
      this.browser = await client.launch();
    }

    return this.browser;
  }

  public async getPage(browser: Browser) {
    const page = await browser.newPage();
    return page;
  }

  public async cleanUp() {
    if (!this.browser) return;

    const pages = await this.browser?.pages()
    for (const page of pages) {
      await page.close();
    }
    
    await this.browser.close();
    this.browser = null;
  }
}

let browserManager: BrowserManager;
export const getBrowserManager = () => {
  if (!browserManager) browserManager = new BrowserManager();
  return browserManager;
};
