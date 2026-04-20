import { getProduct } from '@crawler/actions/get-product';
import { captureSwallowed } from '@crawlers/base';
import { uploadImages } from '@crawlers/base/dist/usecases/upload-images';

export const fetchProduct = async (productUrl: string, categoryUrl: string, language?: string) => {
  return await getProduct(productUrl, categoryUrl, language)
    .then(async (res) => {
      res.images = await uploadImages(res.images);
      return res;
    })
    .catch(err => captureSwallowed(err, 'Error fetching product', {
      tags: { store: 'tradeinn', usecase: 'fetch-product' },
      extra: { productUrl, categoryUrl, language }
    }));
};
