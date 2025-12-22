import { Queue, Worker, WorkerOptions } from 'bullmq';

const DEFAULT_MAX_QUEUE = 1;

// Timeout and concurrency configurations
const DEFAULT_LOCK_DURATION = Number(process.env.JOB_LOCK_DURATION) || 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALLED_INTERVAL = 30000; // Check for stalled jobs every 30 seconds
const DEFAULT_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 1;

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
  return queue;
};

export const createWorker = (queueName: string, queueHandler: any, options: WorkerOptions | {} = {}) => {
  return new Worker(queueName, queueHandler, {
    ...queueConnection,
    lockDuration: DEFAULT_LOCK_DURATION,
    stalledInterval: DEFAULT_STALLED_INTERVAL,
    concurrency: DEFAULT_CONCURRENCY,
    ...options
  });
};

export const removeOptions = {
  removeOnComplete: {
    age: 24 * 3 * 3600 // keep up to 3 days
  },
  removeOnFail: {
    age: 24 * 5 * 3600 // keep up to 5 days
  },
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000
  }
};
