import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CreateViewBoostJobDto, UpdateViewBoostJobDto } from './dto/view-boost-job.dto';
import { db } from '../../db/drizzle';
import { viewBoostJobs } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export type ViewBoostStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';

@Injectable()
export class ViewBoostService {
  private readonly logger = new Logger(ViewBoostService.name);
  private activeJobs = new Map<string, boolean>();

  async createJob(userId: string, dto: CreateViewBoostJobDto) {
    const [job] = await db
      .insert(viewBoostJobs)
      .values({
        userId,
        url: dto.url,
        targetViews: dto.targetViews,
        proxyList: dto.proxyList || '',
        delayMin: dto.delayMin || 5,
        delayMax: dto.delayMax || 30,
        status: 'pending',
        currentViews: 0,
      })
      .returning();

    return job;
  }

  async getJobs(userId: string) {
    return db
      .select()
      .from(viewBoostJobs)
      .where(eq(viewBoostJobs.userId, userId))
      .orderBy(viewBoostJobs.createdAt);
  }

  async getJobById(id: string, userId: string) {
    const [job] = await db
      .select()
      .from(viewBoostJobs)
      .where(and(eq(viewBoostJobs.id, id), eq(viewBoostJobs.userId, userId)))
      .limit(1);
    return job;
  }

  async startJob(jobId: string, userId: string): Promise<void> {
    const job = await this.getJobById(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'running') {
      throw new Error('Job already running');
    }

    await db
      .update(viewBoostJobs)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(viewBoostJobs.id, jobId));

    this.activeJobs.set(jobId, true);
    this.runJob(job);
  }

  async pauseJob(jobId: string, userId: string): Promise<void> {
    const job = await this.getJobById(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    this.activeJobs.set(jobId, false);
    await db
      .update(viewBoostJobs)
      .set({ status: 'paused' })
      .where(eq(viewBoostJobs.id, jobId));
  }

  async deleteJob(jobId: string, userId: string): Promise<void> {
    const job = await this.getJobById(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    this.activeJobs.set(jobId, false);
    await db
      .delete(viewBoostJobs)
      .where(eq(viewBoostJobs.id, jobId));
  }

  private async runJob(job: any): Promise<void> {
    const proxies = job.proxyList
      ? job.proxyList.split('\n').filter(p => p.trim())
      : [];

    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    ];

    let currentViews = job.currentViews;

    while (this.activeJobs.get(job.id) && currentViews < job.targetViews) {
      try {
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const proxy = proxies.length > 0
          ? proxies[Math.floor(Math.random() * proxies.length)]
          : null;

        const config: any = {
          method: 'GET',
          url: job.url,
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
          },
          timeout: 30000,
          maxRedirects: 5,
        };

        if (proxy) {
          config.httpsAgent = new HttpsProxyAgent(proxy);
        }

        await axios(config);

        currentViews++;
        await db
          .update(viewBoostJobs)
          .set({ currentViews })
          .where(eq(viewBoostJobs.id, job.id));

        this.logger.log(`Job ${job.id}: View ${currentViews}/${job.targetViews}`);

        // Random delay between requests
        const delay = Math.floor(
          Math.random() * (job.delayMax - job.delayMin + 1) + job.delayMin
        ) * 1000;
        await this.sleep(delay);

      } catch (error) {
        this.logger.error(`Job ${job.id} error: ${error.message}`);
        await this.sleep(5000);
      }
    }

    if (currentViews >= job.targetViews) {
      await db
        .update(viewBoostJobs)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(viewBoostJobs.id, job.id));
    }

    this.activeJobs.delete(job.id);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
