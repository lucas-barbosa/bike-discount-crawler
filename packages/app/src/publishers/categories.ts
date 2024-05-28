import { publish } from './base';

export const publishCategoriesChange = async (categories: any) => {
  await publish('categories', categories);
};
