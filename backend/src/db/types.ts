import { user, article, wpSite, feed, feedItem, tokenBalance, transaction, subscription, notification, viewBoostJobs } from './schema';

// ==========================================
// USER TYPES
// ==========================================
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

// ==========================================
// ARTICLE TYPES
// ==========================================
export type Article = typeof article.$inferSelect;
export type NewArticle = typeof article.$inferInsert;

// Article status enum type
export type ArticleStatus = 'DRAFT' | 'GENERATING' | 'GENERATED' | 'READY' | 'PUBLISHING' | 'PUBLISHED' | 'SCHEDULED' | 'FAILED';

// Article update data interface
export interface ArticleUpdateData {
    title?: string;
    generatedContent?: string;
    originalContent?: string;
    sourceUrl?: string;
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
    featuredImageUrl?: string;
    status?: ArticleStatus;
    wpPostId?: string | null;
    wpPostUrl?: string | null;
    wpSiteId?: string | null;
    feedItemId?: string | null;
    tokensUsed?: number;
    seoData?: Record<string, unknown>;
    publishedAt?: Date | null;
    updatedAt: Date;
}

// Article create data interface
export interface ArticleCreateData {
    userId: string;
    sourceUrl: string;
    originalContent: string;
    generatedContent: string;
    title: string;
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
    status?: ArticleStatus;
    wpPostId?: string;
    wpPostUrl?: string;
    wpSiteId?: string;
    feedItemId?: string;
    tokensUsed?: number;
}

// ==========================================
// WORDPRESS TYPES
// ==========================================
export type WpSite = typeof wpSite.$inferSelect;
export type NewWpSite = typeof wpSite.$inferInsert;

export type WpSiteStatus = 'PENDING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED';

export interface WpCategory {
    id: number;
    name: string;
    slug: string;
}

export interface WpPostData {
    title: string;
    content: string;
    status: 'draft' | 'publish' | 'private' | 'future';
    categories?: number[];
    featured_media?: number;
    date?: string;
}

export interface WpPostResponse {
    id: number;
    title: { rendered: string };
    status: string;
    link: string;
    date: string;
    slug: string;
}

// ==========================================
// FEED TYPES
// ==========================================
export type Feed = typeof feed.$inferSelect;
export type NewFeed = typeof feed.$inferInsert;
export type FeedItem = typeof feedItem.$inferSelect;
export type NewFeedItem = typeof feedItem.$inferInsert;

export type FeedStatus = 'ACTIVE' | 'PAUSED' | 'ERROR';
export type FeedItemStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'SKIPPED' | 'ERROR';

// ==========================================
// BILLING TYPES
// ==========================================
export type TokenBalance = typeof tokenBalance.$inferSelect;
export type NewTokenBalance = typeof tokenBalance.$inferInsert;
export type Transaction = typeof transaction.$inferSelect;
export type NewTransaction = typeof transaction.$inferInsert;
export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;

export type TransactionType = 'PURCHASE' | 'USAGE' | 'REFUND' | 'SUBSCRIPTION_CREDIT';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type SubscriptionPlan = 'FREE_TRIAL' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';

// ==========================================
// NOTIFICATION TYPES
// ==========================================
export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;

export type NotificationType = 'JOB_SUCCESS' | 'JOB_FAILED' | 'LOW_TOKENS' | 'SUBSCRIPTION_EXPIRING' | 'SYSTEM';

// ==========================================
// VIEW BOOST TYPES
// ==========================================
export type ViewBoostJob = typeof viewBoostJobs.$inferSelect;
export type NewViewBoostJob = typeof viewBoostJobs.$inferInsert;

export type ViewBoostStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused';
export type ViewBoostServiceType = 'standard' | 'premium';

export interface ViewBoostJobUpdate {
    currentViews?: number;
    status?: ViewBoostStatus;
    errorMessage?: string | null;
    startedAt?: Date;
    completedAt?: Date;
    updatedAt: Date;
}
