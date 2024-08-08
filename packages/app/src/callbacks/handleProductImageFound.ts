import { type ProductFoundCallback } from '@crawlers/bike-discount/dist/queue/product';
import { type Product } from '@crawlers/bike-discount/dist/types/Product';
import { enqueueProductImage } from '#queue/product-image';

export const handleProductImageFound: ProductFoundCallback = async (product: Product) => {
  console.log('Enqueue product image');
  await enqueueProductImage(product);
};
