export class Translation {
  id: string;
  crawlerId: string;
  attributes: BikeDiscountAttribute[] = [];
  description: string;
  title: string;
  url: string;
  language: string;

  constructor (id: string, crawlerId: string, title: string, description: string, url: string, language: string) {
    this.id = id;
    this.crawlerId = crawlerId;
    this.title = title;
    this.description = description;
    this.url = url;
    this.language = language;
  }
}
