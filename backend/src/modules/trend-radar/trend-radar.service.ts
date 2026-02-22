import { Injectable, Logger } from '@nestjs/common';
import { OpenAiService } from '../ai/services/openai.service';
import { AdvancedScraperService } from '../scraper/advanced-scraper.service';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class TrendRadarService {
    private readonly logger = new Logger(TrendRadarService.name);

    constructor(
        private openAiService: OpenAiService,
        private advancedScraperService: AdvancedScraperService,
    ) { }

    async searchTrends(query: string) {
        this.logger.log(`Searching trends for: ${query}`);

        try {
            // Updated search URL for Bing News in Indonesia
            const searchUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&cc=id`;

            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
                }
            });

            const $ = cheerio.load(response.data);
            const results: any[] = [];

            $('.news-card').each((i, el) => {
                if (i >= 15) return;

                const title = $(el).find('a.title').text().trim();
                const link = $(el).find('a.title').attr('href');
                const source = $(el).find('.source a').text().trim() || $(el).find('.source').text().trim();
                const time = $(el).find('span[tabindex="0"]').attr('aria-label') || $(el).find('.time').text().trim();

                if (title && link) {
                    results.push({
                        id: `trend-${i}`,
                        title,
                        url: link,
                        source: source || 'News Source',
                        time: time || 'Recently',
                        type: 'news'
                    });
                }
            });

            return {
                success: true,
                data: results
            };
        } catch (error) {
            this.logger.error(`Trend search failed: ${error.message}`);
            return { success: false, error: 'Failed to fetch trends' };
        }
    }

    async analyzeTrend(url: string) {
        this.logger.log(`Analyzing trend: ${url}`);

        try {
            // Bing News provides direct URLs, so we don't need to resolve redirects
            const targetUrl = url;

            // 2. Scrape the trend content
            this.logger.log(`[TrendRadarService] Starting scrape for ${targetUrl}`);
            const scraped = await this.advancedScraperService.scrapeArticle(targetUrl);
            this.logger.log(`[TrendRadarService] Scrape successful for ${scraped.title}`);

            // 3. Use AI to analyze viral potential and hooks
            this.logger.log(`[TrendRadarService] Starting AI analysis...`);
            const analysis = await this.openAiService.analyzeTrend(scraped.content, scraped.title);
            this.logger.log(`[TrendRadarService] AI analysis completed`);

            return {
                success: true,
                data: {
                    ...scraped,
                    analysis
                }
            };
        } catch (error) {
            this.logger.error(`Trend analysis failed for ${url}: ${error.message}`);
            if (error.stack) this.logger.error(error.stack);
            return { success: false, error: 'Failed to analyze trend' };
        }
    }
}
