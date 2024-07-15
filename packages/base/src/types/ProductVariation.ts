import { ProductAttribute } from "./ProductAttribute";

export class ProductVariation {
  id: string;
  attributes: ProductAttribute[];
  availability: string;
  ean: string;
  upc: string;
  price: number;
  invalid: boolean = false;

  constructor (id: string, attributes: ProductAttribute[], availability: number, ean: string, upc: string, price: number) {
    this.id = id;
    this.attributes = attributes;
    this.availability = availability > 0 ? 'instock' : 'outofstock';
    this.ean = ean;
    this.upc = upc;
    this.price = price;
  }

  setInvalid () {
    this.invalid = true;
  }
}
