import { Queue, Worker, WorkerOptions } from 'bullmq';

export const queueConnection = {
  connection: {
    host: process.env.QUEUE_HOST,
    hostport: process.env.QUEUE_HOST,
    password: process.env.QUEUE_PASSWORD
  }
};

export const createQueue = (queueName: string) => {
  return new Queue(queueName, {
    ...queueConnection,
  });
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
