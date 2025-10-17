import { type Job, type Queue } from 'bullmq';
import { createQueue, createWorker, removeOptions } from '@crawlers/base/dist/queue/client';
import { publishAttributesChange } from '#publishers/attributes';

const QUEUE_NAME = 'crawlers.main.attributes';

let queue: Queue;
export const attributeQueue = () => {
  if (!queue) queue = createQueue(QUEUE_NAME);
  return queue;
};

export const attributeWorker = () => {
  const worker = createWorker(QUEUE_NAME, async ({ data }: Job<any>) => {
    console.log('STARTED PUBLISHING attribute');
    await publishAttributesChange(data);
    console.log('FINISHED PUBLISHING attribute');
  });
  return worker;
};

export const enqueueAttributes = async (attribute: any) => {
  attributeQueue();
  await queue.add('attribute', attribute, { ...removeOptions });
};

export const startAttributeQueue = () => {
  attributeQueue();
  attributeWorker();
};
