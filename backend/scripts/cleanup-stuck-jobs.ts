import Queue from 'bull';

type QueueName = 'feed-polling' | 'render' | 'video-clip' | 'instagram-studio' | 'dead-letter';
type CleanStatus = 'completed' | 'failed' | 'delayed' | 'wait' | 'active';

const DEFAULT_QUEUES: QueueName[] = ['feed-polling', 'render', 'video-clip', 'instagram-studio'];
const DEFAULT_STATUSES: CleanStatus[] = ['active', 'wait', 'delayed', 'failed', 'completed'];

const redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number.parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
};

const maxAgeMs = Number.parseInt(process.env.STUCK_JOB_MAX_AGE_MS || `${30 * 60 * 1000}`, 10);
const limit = Number.parseInt(process.env.STUCK_JOB_CLEAN_LIMIT || '100', 10);
const dryRun = process.env.STUCK_JOB_CLEAN_DRY_RUN !== 'false';
const queueNames = parseList<QueueName>(process.env.STUCK_JOB_QUEUES, DEFAULT_QUEUES);
const statuses = parseList<CleanStatus>(process.env.STUCK_JOB_STATUSES, DEFAULT_STATUSES);

function parseList<T extends string>(value: string | undefined, fallback: T[]): T[] {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean) as T[];
}

async function cleanupQueue(queueName: QueueName) {
  const queue = new Queue(queueName, { redis });
  const cutoff = Date.now() - maxAgeMs;
  const report: Record<string, number> = {};

  try {
    for (const status of statuses) {
      const jobs = await queue.getJobs([status], 0, limit - 1, false);
      const staleJobs = jobs.filter((job) => {
        const timestamp = typeof job.timestamp === 'number' ? job.timestamp : 0;
        const processedOn = typeof job.processedOn === 'number' ? job.processedOn : 0;
        const basis = processedOn || timestamp;
        return basis > 0 && basis <= cutoff;
      });

      report[status] = staleJobs.length;

      if (!dryRun) {
        for (const job of staleJobs) {
          await job.remove();
        }
      }
    }
  } finally {
    await queue.close();
  }

  return report;
}

async function main() {
  const result: Record<string, Record<string, number>> = {};

  for (const queueName of queueNames) {
    result[queueName] = await cleanupQueue(queueName);
  }

  console.log(JSON.stringify({ dryRun, maxAgeMs, limit, queues: result }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
