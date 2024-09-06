import { getProduct } from '@crawler/actions/get-product';
import { uploadImages } from '@crawlers/base/dist/usecases/upload-images';

export const fetchProduct = async (productUrl: string, categoryUrl: string, language?: string) => {
  return await getProduct(productUrl, categoryUrl, language)
    .then(async (res) => {
      res.images = await uploadImages(res.images);
      return res;
    })
    .catch(err => {
      console.warn(err);
      return null;
    });
};
