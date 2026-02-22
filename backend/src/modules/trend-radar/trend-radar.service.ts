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
            // Updated search URL for Indonesian locale
            const searchUrl = `https://news.google.com/search?q=${encodeURIComponent(query)}&hl=id&gl=ID&ceid=ID:id`;

            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            const results: any[] = [];

            // Modern Google News uses different selectors than 'article' in some views
            // We search for the title link class 'JtKRv' and find its container
            $('a.JtKRv').each((i, el) => {
                if (i >= 15) return; // Increased limit slightly

                const $titleEl = $(el);
                const title = $titleEl.text().trim();
                const link = $titleEl.attr('href');

                // Find source and time in the common parent container
                const $container = $titleEl.closest('div').parent();
                const source = $container.find('.vr1PYe').text().trim();
                const time = $container.find('time').text().trim();

                if (title && link) {
                    results.push({
                        id: `trend-${i}`,
                        title,
                        url: link.startsWith('./') ? `https://news.google.com${link.substring(1)}` : link,
                        source: source || 'News Source',
                        time: time || 'Recently',
                        type: 'news'
                    });
                }
            });

            // Fallback to old 'article' selector if 'JtKRv' yielded nothing
            if (results.length === 0) {
                $('article').each((i, el) => {
                    if (i >= 10) return;
                    const title = $(el).find('h3').text().trim();
                    const link = $(el).find('a').attr('href');
                    const source = $(el).find('div[data-name]').text().trim() || $(el).find('.vr1PYe').text().trim();
                    const time = $(el).find('time').text().trim();

                    if (title && link) {
                        results.push({
                            id: `trend-fallback-${i}`,
                            title,
                            url: link.startsWith('./') ? `https://news.google.com${link.substring(1)}` : link,
                            source: source || 'News Source',
                            time,
                            type: 'news'
                        });
                    }
                });
            }

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
