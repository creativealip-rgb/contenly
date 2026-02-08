import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ViewBoostJob, ViewBoostStatus } from './entities/view-boost-job.entity';
import { CreateViewBoostJobDto, UpdateViewBoostJobDto } from './dto/view-boost-job.dto';

@Injectable()
export class ViewBoostService {
  private readonly logger = new Logger(ViewBoostService.name);
  private activeJobs = new Map<string, boolean>();

  constructor(
    @InjectRepository(ViewBoostJob)
    private viewBoostJobRepository: Repository<ViewBoostJob>,
  ) {}

  async createJob(userId: string, dto: CreateViewBoostJobDto): Promise<ViewBoostJob> {
    const job = this.viewBoostJobRepository.create({
      userId,
      url: dto.url,
      targetViews: dto.targetViews,
      proxyList: dto.proxyList || '',
      delayMin: dto.delayMin || 5,
      delayMax: dto.delayMax || 30,
      status: ViewBoostStatus.PENDING,
    });

    return this.viewBoostJobRepository.save(job);
  }

  async getJobs(userId: string): Promise<ViewBoostJob[]> {
    return this.viewBoostJobRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getJobById(id: string, userId: string): Promise<ViewBoostJob> {
    return this.viewBoostJobRepository.findOne({
      where: { id, userId },
    });
  }

  async startJob(jobId: string, userId: string): Promise<void> {
    const job = await this.getJobById(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === ViewBoostStatus.RUNNING) {
      throw new Error('Job already running');
    }

    await this.viewBoostJobRepository.update(jobId, {
      status: ViewBoostStatus.RUNNING,
      startedAt: new Date(),
    });

    this.activeJobs.set(jobId, true);
    this.runJob(job);
  }

  async pauseJob(jobId: string, userId: string): Promise<void> {
    const job = await this.getJobById(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    this.activeJobs.set(jobId, false);
    await this.viewBoostJobRepository.update(jobId, {
      status: ViewBoostStatus.PAUSED,
    });
  }

  async deleteJob(jobId: string, userId: string): Promise<void> {
    const job = await this.getJobById(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    this.activeJobs.set(jobId, false);
    await this.viewBoostJobRepository.delete(jobId);
  }

  private async runJob(job: ViewBoostJob): Promise<void> {
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

    while (this.activeJobs.get(job.id) && job.currentViews < job.targetViews) {
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

        job.currentViews++;
        await this.viewBoostJobRepository.update(job.id, {
          currentViews: job.currentViews,
        });

        this.logger.log(`Job ${job.id}: View ${job.currentViews}/${job.targetViews}`);

        // Random delay between requests
        const delay = Math.floor(
          Math.random() * (job.delayMax - job.delayMin + 1) + job.delayMin
        ) * 1000;
        await this.sleep(delay);

      } catch (error) {
        this.logger.error(`Job ${job.id} error: ${error.message}`);
        // Continue to next attempt
        await this.sleep(5000);
      }
    }

    if (job.currentViews >= job.targetViews) {
      await this.viewBoostJobRepository.update(job.id, {
        status: ViewBoostStatus.COMPLETED,
        completedAt: new Date(),
      });
    }

    this.activeJobs.delete(job.id);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
