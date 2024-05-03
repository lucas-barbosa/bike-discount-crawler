import { ProductVariation } from "./ProductVariation";

export class ProductStock {
  availability: string = 'outofstock';
  id: string;
  price: number;
  sku: string;
  variations: ProductVariation[] = [];

  constructor(id: string, price: number, sku: string, availability: string) {
    this.id = id;
    this.price = price;
    this.sku = sku;
    this.availability = availability;
  }
}