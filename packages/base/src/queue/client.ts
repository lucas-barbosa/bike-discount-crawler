import { Queue, Worker, WorkerOptions } from 'bullmq';

const DEFAULT_MAX_QUEUE = 6;

export const queueConnection = {
  connection: {
    host: process.env.QUEUE_HOST,
    hostport: process.env.QUEUE_HOST,
    password: process.env.QUEUE_PASSWORD
  }
};

export const createQueue = (queueName: string) => {
  const queue = new Queue(queueName, {
    ...queueConnection,
  });
  queue.setGlobalConcurrency(isNaN(Number(process.env.MAX_QUEUE)) ? DEFAULT_MAX_QUEUE : Number(process.env.MAX_QUEUE));
};

export const createWorker = (queueName: string, queueHandler: any, options: WorkerOptions | {} = {}) => {
  return new Worker(queueName, queueHandler, {
    ...queueConnection,
    ...options
  });
};

export const removeOptions = {
  removeOnComplete: {
    age: 24 * 3 * 3600 // keep up to 3 days
  },
  removeOnFail: {
    age: 24 * 5 * 3600 // keep up to 5 days
  }
};
