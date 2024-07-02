export class Translation {
  id: string;
  sku: string;
  crawlerId: string;
  attributes: BikeDiscountAttribute[] = [];
  description: string;
  title: string;
  url: string;
  language: string;

  constructor (id: string, sku: string, crawlerId: string, title: string, description: string, url: string, language: string) {
    this.id = id;
    this.sku = sku;
    this.crawlerId = crawlerId;
    this.title = title;
    this.description = description;
    this.url = url;
    this.language = language;
  }
}