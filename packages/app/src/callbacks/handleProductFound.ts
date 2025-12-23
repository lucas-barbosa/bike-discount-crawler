import { type ProductFoundCallback } from '@crawlers/bike-discount/dist/queue/product';
import { type Product } from '@crawlers/bike-discount/dist/types/Product';
import { logger } from '@crawlers/base';
import { enqueueProduct } from '#queue/product';

export const handleProductFound: ProductFoundCallback = async (product: Product) => {
  logger.info({ productId: product.id }, 'Enqueue product');
  await enqueueProduct(product);
};
