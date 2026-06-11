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
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ==========================================
// ENUMS
// ==========================================

export const userRoleEnum = pgEnum('user_role', [
  'user',
  'admin',
  'super_admin',
]);
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
  'DRAFT',
  'GENERATING',
  'GENERATED',
  'READY',
  'PUBLISHING',
  'PUBLISHED',
  'SCHEDULED',
  'FAILED',
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
  'FREE',
  'FREE_TRIAL',
  'STARTER',
  'PRO',
  'BUSINESS',
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
export const viewBoostStatusEnum = pgEnum('view_boost_status', [
  'pending',
  'running',
  'completed',
  'failed',
  'paused',
]);
export const viewBoostServiceTypeEnum = pgEnum('view_boost_service_type', [
  'standard',
  'premium',
]);
export const featureTypeEnum = pgEnum('feature_type', [
  'ARTICLE_GENERATION',
  'INSTAGRAM_GENERATION',
  'VIDEO_GENERATION',
  'VIDEO_LIGHT',
  'VIDEO_HEAVY',
  'MOTION_RENDER',
  'IMAGE_GENERATION',
  'SLIDE_IMAGE',
  'THUMBNAIL_GENERATION',
  'STORYBOARD_GENERATION',
  'HASHTAG_GENERATION',
  'VIDEO_SCRIPT',
  'ALTERNATE_HOOKS',
  'BROLL_KEYWORDS',
  'SUGGEST_FOOTAGE_KEYWORDS',
  'AUTO_CUTAWAY',
  'TTS_PREVIEW',
  'TTS_VOICEOVER',
  'REGENERATE_FIELD',
  'REGENERATE_VOICEOVER',
  'IMPROVE_VISUAL',
  'VIDEO_ANALYSIS',
  'VIDEO_EXPORT',
  'MOTION_GRAPHICS_RENDER',
  'TEXT_OVERLAY',
  'AI_CHAT',
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
  bio: text('bio'),
  role: userRoleEnum('role').default('user'),
  banned: boolean('banned').default(false),
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
}, (table) => ({
  userIdIdx: index('wp_site_user_id_idx').on(table.userId),
}));

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
}, (table) => ({
  userIdIdx: index('feed_user_id_idx').on(table.userId),
  statusIdx: index('feed_status_idx').on(table.status),
}));

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
}, (table) => ({
  feedIdIdx: index('feed_item_feed_id_idx').on(table.feedId),
  statusIdx: index('feed_item_status_idx').on(table.status),
}));

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
  status: articleStatusEnum('status').default('DRAFT'),
  wpPostId: varchar('wp_post_id', { length: 50 }),
  wpPostUrl: text('wp_post_url'),
  tokensUsed: real('tokens_used').default(0),
  seoData: jsonb('seo_data').default({}),
  versions: jsonb('versions').default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  publishedAt: timestamp('published_at'),
}, (table) => ({
  userIdIdx: index('article_user_id_idx').on(table.userId),
  statusIdx: index('article_status_idx').on(table.status),
  createdAtIdx: index('article_created_at_idx').on(table.createdAt),
}));

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
}, (table) => ({
  userIdIdx: index('transaction_user_id_idx').on(table.userId),
  createdAtIdx: index('transaction_created_at_idx').on(table.createdAt),
}));

export const subscription = pgTable('subscription', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  plan: subscriptionPlanEnum('plan').notNull().default('FREE'),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  status: subscriptionStatusEnum('status').default('ACTIVE'),
  tokensPerMonth: integer('tokens_per_month').notNull().default(0),
  currentPeriodStart: timestamp('current_period_start').notNull().defaultNow(),
  currentPeriodEnd: timestamp('current_period_end').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  canceledAt: timestamp('canceled_at'),
}, (table) => ({
  userIdStatusIdx: index('subscription_user_id_status_idx').on(table.userId, table.status),
}));

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
}, (table) => ({
  userIdIdx: index('notification_user_id_idx').on(table.userId),
  createdAtIdx: index('notification_created_at_idx').on(table.createdAt),
}));

// ==========================================
// DAILY USAGE LIMITS
// ==========================================

export const dailyUsage = pgTable('daily_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  date: timestamp('date').notNull().defaultNow(), // Intended to store just the date part ideally
  featureType: featureTypeEnum('feature_type').notNull(),
  count: integer('count').default(0),
}, (table) => ({
  uniqueDailyUserFeature: uniqueIndex('unique_daily_user_feature').on(
    table.userId,
    table.date,
    table.featureType
  ),
}));

// ==========================================
// VIEW BOOST TABLE
// ==========================================

export const viewBoostJobs = pgTable('view_boost_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  targetViews: integer('target_views').notNull(),
  currentViews: integer('current_views').default(0),
  status: viewBoostStatusEnum('status').default('pending'),
  proxyList: text('proxy_list'),
  serviceType: viewBoostServiceTypeEnum('service_type').default('standard'),
  delayMin: integer('delay_min').default(5),
  delayMax: integer('delay_max').default(30),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const instagramProject = pgTable('instagram_project', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  sourceUrl: text('source_url'),
  sourceContent: text('source_content'),
  globalStyle: varchar('global_style', { length: 100 }),
  fontFamily: varchar('font_family', { length: 100 }).default('Montserrat'),
  templateId: varchar('template_id', { length: 100 }),
  totalSlides: integer('total_slides').default(0),
  status: varchar('status', { length: 50 }).default('draft'),
  batchJobId: varchar('batch_job_id', { length: 100 }),
  batchStatus: varchar('batch_status', { length: 50 }).default('idle'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('instagram_project_user_id_idx').on(table.userId),
}));

export const instagramSlide = pgTable('instagram_slide', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => instagramProject.id, { onDelete: 'cascade' }),
  slideNumber: integer('slide_number').notNull(),
  textContent: text('text_content').notNull(),
  visualPrompt: text('visual_prompt'),
  imageUrl: text('image_url'),
  gradientColors: varchar('gradient_colors', { length: 100 }), // Store as "color1,color2"
  layoutPosition: varchar('layout_position', { length: 50 }),
  fontSize: integer('font_size').default(24),
  fontColor: varchar('font_color', { length: 20 }).default('#FFFFFF'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const stylePreset = pgTable('style_preset', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  promptTemplate: text('prompt_template').notNull(),
  negativePrompt: text('negative_prompt'),
  thumbnailUrl: text('thumbnail_url'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ==========================================
// VIDEO SCRIPT GENERATOR
// ==========================================

export const scriptProject = pgTable('script_project', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  sourceUrl: text('source_url'),
  sourceContent: text('source_content'),
  headline: varchar('headline', { length: 255 }),
  subHeadline: varchar('sub_headline', { length: 255 }),
  caption: text('caption'),
  hook: text('hook'),
  thumbnailPrompt: text('thumbnail_prompt'),
  thumbnailUrl: text('thumbnail_url'),
  musicSuggestion: text('music_suggestion'),
  hashtags: jsonb('hashtags').default([]),
  targetDurationSeconds: integer('target_duration_seconds'),
  status: varchar('status', { length: 50 }).default('draft'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('script_project_user_id_idx').on(table.userId),
  createdAtIdx: index('script_project_created_at_idx').on(table.createdAt),
}));

export const scriptScene = pgTable('script_scene', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => scriptProject.id, { onDelete: 'cascade' }),
  sceneNumber: integer('scene_number').notNull(),
  visualContext: text('visual_context').notNull(),
  voiceoverText: text('voiceover_text').notNull(),
  estimatedDuration: integer('estimated_duration'), // in seconds, optional
  emoji: varchar('emoji', { length: 10 }), // Scene mood emoji
  footageSearches: jsonb('footage_searches').default([]),
  brollPrompt: text('broll_prompt'), // Detailed English prompt for AI image gen / b-roll
  selectedFootage: jsonb('selected_footage').default([]), // User-selected footage attached to scene
  directorNotes: text('director_notes'), // Free-form notes for editors / collaborators
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  projectIdIdx: index('script_scene_project_id_idx').on(table.projectId),
}));

// ==========================================
// SOCIAL MEDIA ACCOUNTS
// ==========================================

export const socialAccount = pgTable('social_account', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  platform: varchar('platform', { length: 50 }).notNull(), // 'instagram', 'linkedin', 'twitter'
  accountId: text('account_id').notNull(), // Platform-specific account ID
  accessToken: text('access_token'), // Encrypted access token
  refreshToken: text('refresh_token'), // Encrypted refresh token
  tokenExpiresAt: timestamp('token_expires_at'), // Token expiration
  username: varchar('username', { length: 255 }),
  profileUrl: text('profile_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ==========================================
// BRAND KIT (For Enterprise)
// ==========================================

export const brandKit = pgTable('brand_kit', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  primaryColor: varchar('primary_color', { length: 20 }).default('#000000'),
  secondaryColor: varchar('secondary_color', { length: 20 }).default('#ffffff'),
  accentColor: varchar('accent_color', { length: 20 }).default('#ff0000'),
  fontTitle: varchar('font_title', { length: 100 }).default('Inter'),
  fontBody: varchar('font_body', { length: 100 }).default('Inter'),
  logoUrl: text('logo_url'),
  website: varchar('website', { length: 255 }),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
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
  socialAccounts: many(socialAccount),
  brandKits: many(brandKit),
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

export const tokenBalanceRelations = relations(tokenBalance, ({ one }) => ({
  user: one(user, { fields: [tokenBalance.userId], references: [user.id] }),
}));

export const transactionRelations = relations(transaction, ({ one }) => ({
  user: one(user, { fields: [transaction.userId], references: [user.id] }),
}));

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, { fields: [subscription.userId], references: [user.id] }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, { fields: [notification.userId], references: [user.id] }),
}));

export const instagramProjectRelations = relations(
  instagramProject,
  ({ many, one }) => ({
    slides: many(instagramSlide),
    user: one(user, {
      fields: [instagramProject.userId],
      references: [user.id],
    }),
  }),
);

export const instagramSlideRelations = relations(instagramSlide, ({ one }) => ({
  project: one(instagramProject, {
    fields: [instagramSlide.projectId],
    references: [instagramProject.id],
  }),
}));

export const scriptProjectRelations = relations(
  scriptProject,
  ({ many, one }) => ({
    scenes: many(scriptScene),
    user: one(user, { fields: [scriptProject.userId], references: [user.id] }),
  }),
);

export const scriptSceneRelations = relations(scriptScene, ({ one }) => ({
  project: one(scriptProject, {
    fields: [scriptScene.projectId],
    references: [scriptProject.id],
  }),
}));

export const socialAccountRelations = relations(socialAccount, ({ one }) => ({
  user: one(user, {
    fields: [socialAccount.userId],
    references: [user.id],
  }),
}));

export const brandKitRelations = relations(brandKit, ({ one }) => ({
  user: one(user, {
    fields: [brandKit.userId],
    references: [user.id],
  }),
}));

// ==========================================
// SCHEDULED CONTENT (For Calendar)
// ==========================================

export const scheduledContent = pgTable('scheduled_content', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'article', 'carousel', 'video_script'
  contentId: uuid('content_id'), // Reference to the content (article/carousel/script ID)
  title: varchar('title', { length: 255 }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  platform: varchar('platform', { length: 50 }).notNull(), // 'wordpress', 'instagram', 'linkedin', 'twitter'
  status: varchar('status', { length: 20 }).default('pending'), // 'pending', 'published', 'failed'
  publishedAt: timestamp('published_at'),
  metadata: jsonb('metadata'), // Additional data like hashtags, caption, etc.
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const scheduledContentRelations = relations(scheduledContent, ({ one }) => ({
  user: one(user, {
    fields: [scheduledContent.userId],
    references: [user.id],
  }),
}));

// ==========================================
// CONTENT ANALYTICS (Views, Clicks, Engagement)
// ==========================================

export const contentAnalytics = pgTable('content_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  contentType: varchar('content_type', { length: 50 }).notNull(), // 'article', 'carousel', 'video_script'
  contentId: uuid('content_id').notNull(),
  date: timestamp('date').notNull().defaultNow(),
  views: integer('views').default(0),
  clicks: integer('clicks').default(0),
  engagement: integer('engagement').default(0), // likes, comments, shares
  platform: varchar('platform', { length: 50 }), // where it was published
  metadata: jsonb('metadata'), // additional metrics
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  uniqueContentDate: uniqueIndex('unique_content_date').on(
    table.contentId,
    table.date
  ),
}));

export const contentAnalyticsRelations = relations(contentAnalytics, ({ one }) => ({
  user: one(user, {
    fields: [contentAnalytics.userId],
    references: [user.id],
  }),
}));

// ==========================================
// RENDER PRESETS (User-saved template configs)
// ==========================================

export const renderPresets = pgTable('render_presets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  templateId: varchar('template_id', { length: 100 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  props: jsonb('props').notNull(),
  format: varchar('format', { length: 10 }).default('mp4'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const renderPresetsRelations = relations(renderPresets, ({ one }) => ({
  user: one(user, {
    fields: [renderPresets.userId],
    references: [user.id],
  }),
}));

// ==========================================
// RENDER JOBS (Motion Graphics Queue)
// ==========================================

export const renderJobStatusEnum = pgEnum('render_job_status', [
  'queued',
  'processing',
  'completed',
  'failed',
  'timeout',
]);

export const renderJobs = pgTable('render_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(), // 'template' | 'caption' | 'compose'
  status: renderJobStatusEnum('status').notNull().default('queued'),
  input: jsonb('input').notNull(), // render params (templateId, props, options, etc.)
  outputPath: text('output_path'),
  outputFormat: varchar('output_format', { length: 10 }),
  error: text('error'),
  progress: integer('progress').default(0), // 0-100
  tokensCost: integer('tokens_cost').default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const renderJobsRelations = relations(renderJobs, ({ one }) => ({
  user: one(user, {
    fields: [renderJobs.userId],
    references: [user.id],
  }),
}));

// ==========================================
// VIDEO CLIP PROJECTS
// ==========================================

export const videoClipStatusEnum = pgEnum('video_clip_status', [
  'created',
  'downloading',
  'transcribing',
  'analyzing',
  'ready',
  'failed',
]);

export const videoClipProjects = pgTable('video_clip_projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  sourceUrl: text('source_url').notNull(),
  status: videoClipStatusEnum('status').notNull().default('created'),
  videoPath: text('video_path'),
  thumbnailPath: text('thumbnail_path'),
  duration: integer('duration'),
  metadata: jsonb('metadata'),
  waveform: jsonb('waveform'),
  brollPlan: jsonb('broll_plan').default([]),
  transcript: text('transcript'),
  words: jsonb('words'),
  segments: jsonb('segments'),
  exports: jsonb('exports').default([]),
  error: text('error'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const videoClipProjectsRelations = relations(videoClipProjects, ({ one }) => ({
  user: one(user, {
    fields: [videoClipProjects.userId],
    references: [user.id],
  }),
}));

export const videoClipPreset = pgTable('video_clip_preset', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  // Stored configuration: subtitle style, title style, aspect ratio, crop offset, b-roll defaults
  config: jsonb('config').notNull(),
  isFavorite: boolean('is_favorite').default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const contentTemplate = pgTable('content_template', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  config: jsonb('config').notNull(),
  isFavorite: boolean('is_favorite').default(false),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

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
  viewBoostJobs,
  instagramProject,
  instagramSlide,
  stylePreset,
  scriptProject,
  scriptScene,
  socialAccount,
  brandKit,
  scheduledContent,
  contentAnalytics,
  dailyUsage,
  renderJobs,
  renderPresets,
  videoClipProjects,
  videoClipPreset,
  contentTemplate,
};
