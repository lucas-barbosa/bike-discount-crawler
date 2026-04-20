import { Queue, Worker, WorkerOptions } from 'bullmq';
import { logger } from '../utils/logger';
import { captureException } from '../infrastructure/sentry';

const DEFAULT_MAX_QUEUE = 1;

const workers: Worker[] = [];
const queues: Queue[] = [];

// Timeout and concurrency configurations
const DEFAULT_LOCK_DURATION = Number(process.env.JOB_LOCK_DURATION) || 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALLED_INTERVAL = 30000; // Check for stalled jobs every 30 seconds
const DEFAULT_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 1;

export const queueConnection = {
  connection: {
    host: process.env.QUEUE_HOST,
    port: Number(process.env.QUEUE_PORT) || 6379,
    password: process.env.QUEUE_PASSWORD,
    
    maxRetriesPerRequest: null, // BullMQ precisa disso
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      logger.warn({ attempt: times, delay }, 'Redis reconnecting...');
      return delay;
    },
  }
};

export const createQueue = (queueName: string) => {
  const queue = new Queue(queueName, {
    ...queueConnection,
  });
  queue.setGlobalConcurrency(isNaN(Number(process.env.MAX_QUEUE)) ? DEFAULT_MAX_QUEUE : Number(process.env.MAX_QUEUE));
  queues.push(queue);
  return queue;
};

export const createWorker = (queueName: string, queueHandler: any, options: WorkerOptions | {} = {}) => {
  const worker = new Worker(queueName, queueHandler, {
    ...queueConnection,
    lockDuration: DEFAULT_LOCK_DURATION,
    stalledInterval: DEFAULT_STALLED_INTERVAL,
    concurrency: DEFAULT_CONCURRENCY,
    ...options
  });

  worker.on('completed', (job) => {
    logger.debug({ jobId: job.id, queue: queueName }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, queue: queueName, err }, 'Job failed');
    // Only alert once retries are exhausted — intermediate failures are
    // expected and would flood Sentry.
    const maxAttempts = job?.opts?.attempts ?? 1;
    if (job && job.attemptsMade >= maxAttempts) {
      captureException(err, {
        queue: queueName,
        jobId: job.id,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        data: job.data
      });
    }
  });

  worker.on('error', (err) => {
    logger.error({ queue: queueName, err }, 'Worker error');
    captureException(err, { queue: queueName, kind: 'worker-error' });
  });

  worker.on('stalled', (jobId) => {
    logger.warn({ jobId, queue: queueName }, 'Job stalled');
  });

  workers.push(worker);
  return worker;
};

const DEFAULT_CLOSE_TIMEOUT_MS = Number(process.env.WORKER_CLOSE_TIMEOUT) || 8000;

/**
 * Gracefully close all workers and queues.
 *
 * Strategy:
 *  1. Try graceful `worker.close(false)` — lets the current job finish cleanly.
 *  2. If it doesn't finish within `timeoutMs`, fall back to force close
 *     (`worker.close(true)`) which abandons the job.
 *  3. After workers are closed, any job still sitting in `active` is requeued
 *     back to `wait` via direct Redis manipulation, so the next boot picks it
 *     up immediately instead of waiting up to `lockDuration` for the lock to
 *     expire and the stalled detector to recover it.
 */
export const closeQueueClients = async (timeoutMs = DEFAULT_CLOSE_TIMEOUT_MS) => {
  await Promise.all(
    workers.map(async (worker) => {
      let timer: NodeJS.Timeout | undefined;
      try {
        await Promise.race([
          worker.close(false),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('worker-close-timeout')), timeoutMs);
          })
        ]);
      } catch (err) {
        logger.warn({ err }, 'Worker graceful close timed out or failed — forcing close');
        await worker.close(true).catch((e) => logger.error({ err: e }, 'Force close failed'));
      } finally {
        if (timer) clearTimeout(timer);
      }
    })
  );

  await Promise.all(
    queues.map(async (queue) => {
      try {
        const active = await queue.getActive();
        if (active.length > 0) {
          logger.info({ queue: queue.name, count: active.length }, 'Requeuing abandoned active jobs');
          const client = await queue.client;
          const prefix = queue.opts.prefix || 'bull';
          const base = `${prefix}:${queue.name}`;
          for (const job of active) {
            if (!job.id) continue;
            try {
              const multi = client.multi();
              multi.lrem(`${base}:active`, 0, job.id);
              multi.rpush(`${base}:wait`, job.id);
              multi.del(`${base}:${job.id}:lock`);
              await multi.exec();
            } catch (err) {
              logger.error({ err, jobId: job.id, queue: queue.name }, 'Error requeuing active job');
            }
          }
        }
      } catch (err) {
        logger.error({ err, queue: queue.name }, 'Error inspecting active jobs');
      }

      try {
        await queue.close();
      } catch (err) {
        logger.error({ err, queue: queue.name }, 'Error closing queue');
      }
    })
  );
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
