import { publish } from './base';

export const publishAttributesChange = async (attributes: any) => {
  await publish('attributes', attributes);
};
