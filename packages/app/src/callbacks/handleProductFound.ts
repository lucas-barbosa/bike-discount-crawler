import { type ProductFoundCallback } from '@crawlers/bike-discount/dist/queue/product';
import { type Product } from '@crawlers/bike-discount/dist/types/Product';
import { enqueueProduct } from '#queue/product';

export const handleProductFound: ProductFoundCallback = async (product: Product) => {
  console.log('Enqueue product');
  await enqueueProduct(product);
};
