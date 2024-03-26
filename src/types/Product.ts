import { ProductVariation } from "./ProductVariation";

export class Product {
  attributes: BikeDiscountAttribute[] = [];
  availability: string = 'outofstock';
  brand: string = '';
  categories: any[] = [];
  crossSelledProducts: string[] = [];
  description: string = '';
  dimensions?: Dimension;
  id: string;
  invalid: boolean = false;
  images: string[] = [];
  parentStoreProps: any = [];
  price: number;
  sku: string;
  title: string;
  url: string;
  variations: ProductVariation[] = [];
  weight?: Weight;

  constructor(id: string, price: number, title: string, sku: string, url: string) {
    this.id = id;
    this.price = price;
    this.title = title;
    this.sku = sku;
    this.url = url;
  }
}