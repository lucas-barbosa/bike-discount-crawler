import { type Product } from '@crawlers/bike-discount/src/types/Product';
import { publish } from './base';

export const publishProductChanges = async (product: Product) => {
  await publish('product', product);
};
