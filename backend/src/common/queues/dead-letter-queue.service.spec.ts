import { DeadLetterQueueService } from './dead-letter-queue.service';

describe('DeadLetterQueueService', () => {
  const createService = () => {
    const queue = {
      add: jest.fn().mockResolvedValue(undefined),
    };
    return {
      service: new DeadLetterQueueService(queue as any),
      queue,
    };
  };

  it('writes failed jobs to dead-letter queue', async () => {
    const { service, queue } = createService();
    const job = {
      queue: { name: 'render' },
      name: 'template',
      id: 'job-1',
      attemptsMade: 1,
      opts: { attempts: 2 },
      data: { jobId: 'render-1' },
      stacktrace: ['stack line'],
    };

    await service.captureFailedJob(job as any, new Error('render exploded'));

    expect(queue.add).toHaveBeenCalledWith(
      'failed-job',
      expect.objectContaining({
        sourceQueue: 'render',
        sourceJobName: 'template',
        sourceJobId: 'job-1',
        attemptsMade: 1,
        maxAttempts: 2,
        failedReason: 'render exploded',
        data: { jobId: 'render-1' },
        stacktrace: ['stack line'],
      }),
      expect.objectContaining({
        attempts: 1,
        removeOnComplete: false,
        removeOnFail: false,
      }),
    );
  });

  it('does not throw when dead-letter write fails', async () => {
    const queue = {
      add: jest.fn().mockRejectedValue(new Error('redis down')),
    };
    const service = new DeadLetterQueueService(queue as any);

    await expect(
      service.captureFailedJob({ queue: { name: 'feed-polling' }, id: 'job-2', data: {} } as any, 'boom'),
    ).resolves.toBeUndefined();
  });
});
