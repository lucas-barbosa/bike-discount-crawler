import { type ProductVariation } from './ProductVariation';

export class Product {
  crawlerId: string = '';
  attributes: BikeDiscountAttribute[] = [];
  availability: string = 'outofstock';
  brand: string = '';
  categories: string[] = [];
  categoryUrl: string = '';
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

  constructor (id: string, price: number, title: string, sku: string, url: string, categoryUrl: string) {
    this.id = id;
    this.price = price;
    this.title = title;
    this.sku = sku;
    this.url = url;
    this.categoryUrl = categoryUrl;
  }

  setInvalid () {
    this.invalid = true;
  }

  getLargestSide () {
    if (!this.dimensions) {
      return {
        value: 20,
        unit: 'cm'
      };
    }

    const unit = this.dimensions.unit ?? 'cm';
    const sides = [
      Number(this.dimensions.height),
      Number(this.dimensions.length),
      Number(this.dimensions.width)
    ];
    const largestSide = Math.max(...sides);

    return {
      value: largestSide || 20,
      unit
    };
  }

  getSize () {
    if (!this.dimensions) {
      return {
        value: 0,
        unit: 'cm'
      };
    }

    const unit = this.dimensions.unit ?? 'cm';
    const sides = [
      Number(this.dimensions.height),
      Number(this.dimensions.length),
      Number(this.dimensions.width)
    ];
    const size = sides[0] + sides[1] + sides[2];

    return {
      value: size,
      unit
    };
  }

  get isVariable () {
    return this.variations.length > 0;
  }

  get isValid () {
    return !this.invalid;
  }
}
