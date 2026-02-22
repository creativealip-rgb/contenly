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
            // Mocking discovery from Google News/RSS for MVP
            // In a real scenario, we'd use a Search API or a more complex discovery scraper
            const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;

            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const results: any[] = [];

            $('article').each((i, el) => {
                if (i >= 10) return; // Limit to top 10

                const title = $(el).find('h3').text().trim();
                const link = $(el).find('a').attr('href');
                const source = $(el).find('div[data-name]').text().trim();
                const time = $(el).find('time').text().trim();

                if (title && link) {
                    results.push({
                        id: `trend-${i}`,
                        title,
                        url: link.startsWith('./') ? `https://news.google.com${link.substring(1)}` : link,
                        source,
                        time,
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
            // 1. Scrape the trend content
            const scraped = await this.advancedScraperService.scrapeArticle(url);

            // 2. Use AI to analyze viral potential and hooks
            const analysis = await this.openAiService.analyzeTrend(scraped.content, scraped.title);

            return {
                success: true,
                data: {
                    ...scraped,
                    analysis
                }
            };
        } catch (error) {
            this.logger.error(`Trend analysis failed: ${error.message}`);
            return { success: false, error: 'Failed to analyze trend' };
        }
    }
}
