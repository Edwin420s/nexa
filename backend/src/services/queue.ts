import Queue from 'bull';
import { getRedisClient } from './redis';
import logger from '../utils/logger';

export interface AgentJob {
  projectId: string;
  agentName: string;
  goal: string;
  config?: Record<string, any>;
}

let agentQueue: Queue.Queue<AgentJob> | null = null;

export const initializeQueue = async () => {
  const redisClient = getRedisClient();

  agentQueue = new Queue<AgentJob>('agent-execution', {
    redis: {
      port: Number(process.env.REDIS_PORT) || 6379,
      host: process.env.REDIS_HOST || 'localhost',
      password: process.env.REDIS_PASSWORD
    },
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: 100,
      removeOnFail: 50
    }
  });

  logger.info('Agent queue initialized');
  return agentQueue;
};

export const getQueue = (): Queue.Queue<AgentJob> => {
  if (!agentQueue) {
    throw new Error('Queue not initialized');
  }
  return agentQueue;
};

export const addAgentJob = async (jobData: AgentJob): Promise<Queue.Job<AgentJob>> => {
  const queue = getQueue();
  return queue.add(jobData, {
    priority: 1,
    timeout: 300000 // 5 minutes
  });
};

export const getJobStatus = async (jobId: string) => {
  const queue = getQueue();
  const job = await queue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress(),
    data: job.data,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason
  };
};

export const closeQueue = async () => {
  if (agentQueue) {
    await agentQueue.close();
    logger.info('Agent queue closed');
  }
};