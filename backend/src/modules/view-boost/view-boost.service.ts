import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { CreateViewBoostJobDto } from './dto/view-boost-job.dto';
import { DrizzleService } from '../../db/drizzle.service';
import { viewBoostJobs } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ViewBoostJob, ViewBoostStatus, ViewBoostJobUpdate } from '../../db/types';

puppeteer.use(StealthPlugin());

@Injectable()
export class ViewBoostService {
  private readonly logger = new Logger(ViewBoostService.name);
  private activeJobs = new Map<string, boolean>();

  constructor(private readonly drizzleService: DrizzleService) { }

  private get db() {
    return this.drizzleService.db;
  }

  async createJob(userId: string, dto: CreateViewBoostJobDto) {
    const [job] = await this.db
      .insert(viewBoostJobs)
      .values({
        userId,
        url: dto.url,
        targetViews: dto.targetViews,
        proxyList: dto.proxyList || '',
        serviceType: dto.serviceType || 'standard',
        delayMin: dto.delayMin || 5,
        delayMax: dto.delayMax || 30,
        status: 'pending',
        currentViews: 0,
      })
      .returning();

    return job;
  }

  async getJobs(userId: string) {
    return this.db
      .select()
      .from(viewBoostJobs)
      .where(eq(viewBoostJobs.userId, userId))
      .orderBy(viewBoostJobs.createdAt);
  }

  async getJobById(id: string, userId: string) {
    const [job] = await this.db
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

    await this.db
      .update(viewBoostJobs)
      .set({ status: 'running', startedAt: new Date() })
      .where(eq(viewBoostJobs.id, jobId));

    this.activeJobs.set(jobId, true);

    // Start job process in background
    if (job.serviceType === 'premium') {
      this.runPremiumJob(job);
    } else {
      this.runStandardJob(job);
    }
  }

  async pauseJob(jobId: string, userId: string): Promise<void> {
    const job = await this.getJobById(jobId, userId);
    if (!job) {
      throw new Error('Job not found');
    }

    this.activeJobs.set(jobId, false);
    await this.db
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
    await this.db
      .delete(viewBoostJobs)
      .where(eq(viewBoostJobs.id, jobId));
  }

  private async runStandardJob(job: ViewBoostJob): Promise<void> {
    const proxies = this.parseProxies(job.proxyList || '');
    const userAgents = this.getUserAgents();
    let currentViews = job.currentViews || 0;

    while (this.activeJobs.get(job.id) && currentViews < job.targetViews) {
      try {
        const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
        const proxy = this.getRandomItem(proxies);

        const config: AxiosRequestConfig = {
          method: 'GET',
          url: job.url,
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'DNT': '1',
            'Connection': 'keep-alive',
          },
          timeout: 30000,
        };

        if (proxy) {
          config.httpsAgent = new HttpsProxyAgent(proxy);
        }

        await axios(config);
        currentViews++;
        await this.updateProgress(job.id, currentViews);

        this.logger.log(`Job ${job.id} (Standard): View ${currentViews}/${job.targetViews}`);
        await this.sleep(this.getRandomDelay(job.delayMin || 5, job.delayMax || 30));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Job ${job.id} Standard error: ${message}`);
        await this.sleep(5000);
      }
    }

    await this.finalizeJob(job, currentViews);
  }

  private async runPremiumJob(job: ViewBoostJob): Promise<void> {
    const proxies = this.parseProxies(job.proxyList || '');
    let currentViews = job.currentViews || 0;

    while (this.activeJobs.get(job.id) && currentViews < job.targetViews) {
      let browser;
      try {
        const proxy = this.getRandomItem(proxies);
        const args = [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-infobars',
          '--window-position=0,0',
          '--ignore-certifcate-errors',
          '--ignore-certifcate-errors-spki-list',
        ];

        if (proxy) {
          args.push(`--proxy-server=${proxy}`);
        }

        browser = await puppeteer.launch({
          headless: true,
          args,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        });

        const page = await browser.newPage();

        // Optimized: Block heavy resources and ads to save bandwidth
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          const resourceType = request.resourceType();
          const url = request.url().toLowerCase();

          // Block heavy assets
          const blockedTypes = ['image', 'font', 'stylesheet', 'media'];
          if (blockedTypes.includes(resourceType)) {
            return request.abort();
          }

          // Block common ad networks (but ALLOW Google Analytics/Tag Manager)
          const adPatterns = [
            'doubleclick.net',
            'adnxs.com',
            'adsystem.com',
            'adform.net',
            'adroll.com',
            'scorecardresearch.com',
            'taboola.com',
            'outbrain.com',
            'amazon-adsystem.com',
            'facebook.com/tr',
          ];

          if (adPatterns.some(pattern => url.includes(pattern))) {
            return request.abort();
          }

          request.continue();
        });

        // Randomize viewport
        await page.setViewport({
          width: 1280 + Math.floor(Math.random() * 100),
          height: 720 + Math.floor(Math.random() * 100),
          deviceScaleFactor: 1,
        });

        // Set random User-Agent if not using proxy or if proxy doesn't handle it
        await page.setUserAgent(this.getRandomItem(this.getUserAgents()));

        this.logger.log(`Job ${job.id} (Premium): Navigating to ${job.url}`);

        // Navigate with realistic timeout and wait conditions
        await page.goto(job.url, {
          waitUntil: 'networkidle2',
          timeout: 60000
        });

        // Simulasikan aktivitas sedikit (scrolling)
        await page.evaluate(async () => {
          await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
              const scrollHeight = document.body.scrollHeight;
              window.scrollBy(0, distance);
              totalHeight += distance;
              if (totalHeight >= scrollHeight || totalHeight > 2000) {
                clearInterval(timer);
                resolve(null);
              }
            }, 100);
          });
        });

        // Stay on page for a bit more to ensure GA fires
        await this.sleep(5000 + Math.random() * 5000);

        currentViews++;
        await this.updateProgress(job.id, currentViews);
        this.logger.log(`Job ${job.id} (Premium): View ${currentViews}/${job.targetViews}`);

        await browser.close();
        browser = null;

        await this.sleep(this.getRandomDelay(job.delayMin || 5, job.delayMax || 30));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Job ${job.id} Premium error: ${message}`);
        if (browser) await browser.close();
        await this.sleep(5000);
      }
    }

    await this.finalizeJob(job, currentViews);
  }

  private parseProxies(proxyList: string): string[] {
    return proxyList ? proxyList.split('\n').filter(p => p.trim()) : [];
  }

  private getUserAgents(): string[] {
    return [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    ];
  }

  private getRandomItem<T>(items: T[]): T | null {
    return items.length > 0 ? items[Math.floor(Math.random() * items.length)] : null;
  }

  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min) * 1000;
  }

  private async updateProgress(jobId: string, currentViews: number): Promise<void> {
    await this.db
      .update(viewBoostJobs)
      .set({ currentViews })
      .where(eq(viewBoostJobs.id, jobId));
  }

  private async finalizeJob(job: ViewBoostJob, currentViews: number): Promise<void> {
    if (currentViews >= job.targetViews) {
      const updateData: ViewBoostJobUpdate = {
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      };
      await this.db
        .update(viewBoostJobs)
        .set(updateData)
        .where(eq(viewBoostJobs.id, job.id));
    }
    this.activeJobs.delete(job.id);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
