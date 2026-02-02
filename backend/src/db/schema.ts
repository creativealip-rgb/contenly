import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  real,
  timestamp,
  pgEnum,
  jsonb,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// ENUMS
// ==========================================

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const wpSiteStatusEnum = pgEnum('wp_site_status', [
  'PENDING',
  'CONNECTED',
  'ERROR',
  'DISCONNECTED',
]);
export const feedStatusEnum = pgEnum('feed_status', [
  'ACTIVE',
  'PAUSED',
  'ERROR',
]);
export const feedItemStatusEnum = pgEnum('feed_item_status', [
  'PENDING',
  'PROCESSING',
  'PROCESSED',
  'SKIPPED',
  'ERROR',
]);
export const articleStatusEnum = pgEnum('article_status', [
  'GENERATED',
  'DRAFT',
  'PUBLISHED',
  'SCHEDULED',
]);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'PURCHASE',
  'USAGE',
  'REFUND',
  'SUBSCRIPTION_CREDIT',
]);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
]);
export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'FREE_TRIAL',
  'PRO',
  'ENTERPRISE',
]);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE',
  'PAST_DUE',
  'CANCELED',
  'EXPIRED',
]);
export const notificationTypeEnum = pgEnum('notification_type', [
  'JOB_SUCCESS',
  'JOB_FAILED',
  'LOW_TOKENS',
  'SUBSCRIPTION_EXPIRING',
  'SYSTEM',
]);

// ==========================================
// BETTER AUTH TABLES (Required)
// ==========================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: userRoleEnum('role').default('USER'),
  preferences: jsonb('preferences').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ==========================================
// API KEYS
// ==========================================

export const apiKey = pgTable('api_key', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: text('key_hash').notNull(),
  keyPrefix: varchar('key_prefix', { length: 20 }).notNull(),
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==========================================
// WORDPRESS SITES
// ==========================================

export const wpSite = pgTable('wp_site', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  username: varchar('username', { length: 255 }).notNull(),
  appPasswordEncrypted: text('app_password_encrypted').notNull(),
  status: wpSiteStatusEnum('status').default('PENDING'),
  categoriesCache: jsonb('categories_cache').default([]),
  lastHealthCheck: timestamp('last_health_check'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const categoryMapping = pgTable(
  'category_mapping',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wpSiteId: uuid('wp_site_id')
      .notNull()
      .references(() => wpSite.id, { onDelete: 'cascade' }),
    sourceCategory: varchar('source_category', { length: 255 }).notNull(),
    targetCategoryId: varchar('target_category_id', { length: 50 }).notNull(),
    targetCategoryName: varchar('target_category_name', {
      length: 255,
    }).notNull(),
  },
  (table) => ({
    uniqueMapping: uniqueIndex('unique_wp_site_source_category').on(
      table.wpSiteId,
      table.sourceCategory,
    ),
  }),
);

// ==========================================
// RSS FEEDS
// ==========================================

export const feed = pgTable('feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  url: text('url').notNull(),
  pollingIntervalMinutes: integer('polling_interval_minutes').default(15),
  autoPublish: boolean('auto_publish').default(false),
  defaultWpSiteId: uuid('default_wp_site_id').references(() => wpSite.id, {
    onDelete: 'set null',
  }),
  status: feedStatusEnum('status').default('ACTIVE'),
  lastPolledAt: timestamp('last_polled_at'),
  itemsFetched: integer('items_fetched').default(0),
  successRate: real('success_rate').default(100),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const feedItem = pgTable('feed_item', {
  id: uuid('id').primaryKey().defaultRandom(),
  feedId: uuid('feed_id')
    .notNull()
    .references(() => feed.id, { onDelete: 'cascade' }),
  guid: text('guid').notNull().unique(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  contentPreview: text('content_preview'),
  status: feedItemStatusEnum('status').default('PENDING'),
  publishedAt: timestamp('published_at'),
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
});

// ==========================================
// ARTICLES
// ==========================================

export const article = pgTable('article', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  feedItemId: uuid('feed_item_id').references(() => feedItem.id, {
    onDelete: 'set null',
  }),
  wpSiteId: uuid('wp_site_id').references(() => wpSite.id, {
    onDelete: 'set null',
  }),
  sourceUrl: text('source_url').notNull(),
  originalContent: text('original_content').notNull(),
  generatedContent: text('generated_content').notNull(),
  title: text('title').notNull(),
  metaTitle: varchar('meta_title', { length: 255 }),
  metaDescription: text('meta_description'),
  slug: varchar('slug', { length: 255 }),
  featuredImageUrl: text('featured_image_url'),
  status: articleStatusEnum('status').default('GENERATED'),
  wpPostId: varchar('wp_post_id', { length: 50 }),
  wpPostUrl: text('wp_post_url'),
  tokensUsed: real('tokens_used').default(0),
  seoData: jsonb('seo_data').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
});

// ==========================================
// BILLING & TOKENS
// ==========================================

export const tokenBalance = pgTable('token_balance', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(),
  balance: real('balance').default(0),
  totalPurchased: real('total_purchased').default(0),
  totalUsed: real('total_used').default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const transaction = pgTable('transaction', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  amount: real('amount').notNull(), // In dollars
  tokens: real('tokens').notNull(),
  stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
  status: transactionStatusEnum('status').default('PENDING'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const subscription = pgTable('subscription', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  plan: subscriptionPlanEnum('plan').notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  status: subscriptionStatusEnum('status').default('ACTIVE'),
  tokensPerMonth: integer('tokens_per_month').notNull(),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  canceledAt: timestamp('canceled_at'),
});

// ==========================================
// NOTIFICATIONS
// ==========================================

export const notification = pgTable('notification', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: jsonb('data').default({}),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==========================================
// RELATIONS
// ==========================================

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  apiKeys: many(apiKey),
  wpSites: many(wpSite),
  feeds: many(feed),
  articles: many(article),
  tokenBalance: one(tokenBalance),
  transactions: many(transaction),
  subscriptions: many(subscription),
  notifications: many(notification),
}));

export const wpSiteRelations = relations(wpSite, ({ one, many }) => ({
  user: one(user, { fields: [wpSite.userId], references: [user.id] }),
  categoryMappings: many(categoryMapping),
  articles: many(article),
}));

export const feedRelations = relations(feed, ({ one, many }) => ({
  user: one(user, { fields: [feed.userId], references: [user.id] }),
  defaultWpSite: one(wpSite, {
    fields: [feed.defaultWpSiteId],
    references: [wpSite.id],
  }),
  items: many(feedItem),
}));

export const feedItemRelations = relations(feedItem, ({ one }) => ({
  feed: one(feed, { fields: [feedItem.feedId], references: [feed.id] }),
  article: one(article, {
    fields: [feedItem.id],
    references: [article.feedItemId],
  }),
}));

export const articleRelations = relations(article, ({ one }) => ({
  user: one(user, { fields: [article.userId], references: [user.id] }),
  feedItem: one(feedItem, {
    fields: [article.feedItemId],
    references: [feedItem.id],
  }),
  wpSite: one(wpSite, { fields: [article.wpSiteId], references: [wpSite.id] }),
}));

// Export all schemas for Better Auth
export const schema = {
  user,
  session,
  account,
  verification,
  apiKey,
  wpSite,
  categoryMapping,
  feed,
  feedItem,
  article,
  tokenBalance,
  transaction,
  subscription,
  notification,
};
