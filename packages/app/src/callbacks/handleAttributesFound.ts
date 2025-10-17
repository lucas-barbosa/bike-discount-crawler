import { enqueueAttributes } from '#queue/attributes';

export const handleAttributesFound = async (attributes: any[]) => {
  console.log('Enqueue attributes:');
  await enqueueAttributes(attributes);
};
