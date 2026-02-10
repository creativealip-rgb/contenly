import { Injectable, Logger } from '@nestjs/common';
import Parser from 'rss-parser';
import { DrizzleService } from '../../db/drizzle.service';
import { feed, feedItem } from '../../db/schema';
import { eq, and, sql, count } from 'drizzle-orm';

@Injectable()
export class FeedPollerService {
    private readonly logger = new Logger(FeedPollerService.name);
    private readonly parser: Parser;

    constructor(private drizzle: DrizzleService) {
        this.parser = new Parser({
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
        });
    }

    get db() {
        return this.drizzle.db;
    }

    async pollFeed(feedId: string): Promise<{ newItems: number; totalItems: number }> {
        try {
            this.logger.log(`Polling feed: ${feedId}`);

            // Get feed details
            const feedData = await this.db.query.feed.findFirst({
                where: eq(feed.id, feedId),
            });

            if (!feedData) {
                throw new Error(`Feed not found: ${feedId}`);
            }

            // Parse RSS feed with simple discovery
            let rssFeed;
            const urlsToTry = [
                feedData.url,
                feedData.url.endsWith('/') ? `${feedData.url}feed/` : `${feedData.url}/feed/`,
                feedData.url.endsWith('/') ? `${feedData.url}rss/` : `${feedData.url}/rss/`,
                feedData.url.endsWith('/') ? `${feedData.url}feed.xml` : `${feedData.url}/feed.xml`,
            ];

            let lastError;
            for (const url of urlsToTry) {
                try {
                    this.logger.log(`Trying to parse RSS from: ${url}`);
                    rssFeed = await this.parser.parseURL(url);
                    if (rssFeed) {
                        this.logger.log(`Successfully found feed at: ${url}`);
                        // If we found it at a different URL, we could optionally update the feed record
                        break;
                    }
                } catch (err) {
                    lastError = err;
                    continue;
                }
            }

            if (!rssFeed) {
                throw lastError || new Error('Could not find a valid RSS feed at this URL');
            }

            this.logger.log(`Fetched ${rssFeed.items.length} items from ${feedData.url}`);

            let newItemCount = 0;

            // Process each item
            for (const item of rssFeed.items) {
                const guid = item.guid || item.link || '';
                if (!guid) {
                    this.logger.warn('Skipping item without guid or link');
                    continue;
                }

                // Check if item already exists
                const existing = await this.db.query.feedItem.findFirst({
                    where: eq(feedItem.guid, guid),
                });

                if (!existing) {
                    // Insert new item
                    await this.db.insert(feedItem).values({
                        feedId: feedData.id,
                        guid,
                        title: item.title || 'Untitled',
                        url: item.link || '',
                        contentPreview: item.contentSnippet || item.content?.substring(0, 500),
                        publishedAt: item.pubDate ? new Date(item.pubDate) : null,
                        status: 'PENDING',
                    });
                    newItemCount++;
                }
            }

            // Update feed stats
            const countResult = await this.db
                .select({ count: count() })
                .from(feedItem)
                .where(eq(feedItem.feedId, feedData.id));

            const totalItems = countResult[0]?.count || 0;

            await this.db
                .update(feed)
                .set({
                    lastPolledAt: new Date(),
                    itemsFetched: totalItems,
                    updatedAt: new Date(),
                })
                .where(eq(feed.id, feedData.id));

            this.logger.log(`Saved ${newItemCount} new items for feed ${feedData.name}. Total: ${totalItems}`);

            return { newItems: newItemCount, totalItems };
        } catch (error) {
            this.logger.error(`Failed to poll feed ${feedId}: ${error instanceof Error ? error.message : 'Unknown error'}`);

            // Update feed with error status if needed
            await this.db
                .update(feed)
                .set({
                    lastPolledAt: new Date(),
                    status: 'ERROR',
                    updatedAt: new Date(),
                })
                .where(eq(feed.id, feedId));

            throw error;
        }
    }

    async pollAllActiveFeeds(): Promise<void> {
        try {
            const activeFeeds = await this.db.query.feed.findMany({
                where: eq(feed.status, 'ACTIVE'),
            });

            this.logger.log(`Polling ${activeFeeds.length} active feeds`);

            for (const feedData of activeFeeds) {
                try {
                    await this.pollFeed(feedData.id);
                } catch (error) {
                    // Continue with other feeds even if one fails
                    this.logger.error(`Error polling feed ${feedData.name}: ${error instanceof Error ? error.message : 'Unknown'}`);
                }
            }
        } catch (error) {
            this.logger.error(`Error in pollAllActiveFeeds: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
    }
}
