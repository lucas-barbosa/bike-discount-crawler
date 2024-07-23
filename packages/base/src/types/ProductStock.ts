import { type ProductVariation } from './ProductVariation';

export class ProductStock {
  crawlerId: string = '';
  availability: string = 'outofstock';
  id: string;
  price: number;
  sku: string;
  url?: string;
  variations: ProductVariation[] = [];

  constructor (id: string, price: number, sku: string, availability: string, variations: ProductVariation[] = []) {
    this.id = id;
    this.price = price;
    this.sku = sku;
    this.availability = availability;
    this.variations = variations;
  }
}
