import { type ProductFoundCallback } from '@crawlers/bike-discount/dist/queue/product';
import { type Product } from '@crawlers/bike-discount/dist/types/Product';
import { logger } from '@crawlers/base';
import { enqueueProductImage } from '#queue/product-image';

export const handleProductImageFound: ProductFoundCallback = async (product: Product) => {
  logger.info({ productId: product.id }, 'Enqueue product image');
  await enqueueProductImage(product);
};
