import { Queue, Worker } from 'bullmq';

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

export const createWorker = (queueName: string, queueHandler: any) => {
  return new Worker(queueName, queueHandler, {
    ...queueConnection
  });
};
