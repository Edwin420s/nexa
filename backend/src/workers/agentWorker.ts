import Queue from 'bull';
import { runOrchestrator } from '../agent-orchestrator';
import { initializeQueue, AgentJob } from '../services/queue';
import logger from '../utils/logger';

export const setupWorker = async () => {
    const queue = await initializeQueue();

    queue.process(async (job: Queue.Job<AgentJob>) => {
        logger.info(`Processing job ${job.id} for project ${job.data.projectId}`);

        try {
            await runOrchestrator(job.data.projectId, job.data.config);

            logger.info(`Job ${job.id} completed successfully`);
            return { success: true, projectId: job.data.projectId };
        } catch (error: any) {
            logger.error(`Job ${job.id} failed:`, error);
            throw error;
        }
    });

    queue.on('completed', (job, result) => {
        logger.info(`Job ${job.id} completed:`, result);
    });

    queue.on('failed', (job, err) => {
        logger.error(`Job ${job!.id} failed:`, err);
    });

    queue.on('stalled', (job) => {
        logger.warn(`Job ${job.id} stalled`);
    });

    logger.info('Queue worker setup complete');

    return queue;
};

// Start worker if run directly
if (require.main === module) {
    setupWorker().catch(error => {
        logger.error('Failed to start worker:', error);
        process.exit(1);
    });
}
