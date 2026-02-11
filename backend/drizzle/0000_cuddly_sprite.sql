CREATE TYPE "public"."article_status" AS ENUM('DRAFT', 'GENERATING', 'GENERATED', 'READY', 'PUBLISHING', 'PUBLISHED', 'SCHEDULED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."feed_item_status" AS ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'SKIPPED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."feed_status" AS ENUM('ACTIVE', 'PAUSED', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('JOB_SUCCESS', 'JOB_FAILED', 'LOW_TOKENS', 'SUBSCRIPTION_EXPIRING', 'SYSTEM');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('FREE_TRIAL', 'PRO', 'ENTERPRISE');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('PURCHASE', 'USAGE', 'REFUND', 'SUBSCRIPTION_CREDIT');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN', 'SUPER_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."view_boost_service_type" AS ENUM('standard', 'premium');--> statement-breakpoint
CREATE TYPE "public"."view_boost_status" AS ENUM('pending', 'running', 'completed', 'failed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."wp_site_status" AS ENUM('PENDING', 'CONNECTED', 'ERROR', 'DISCONNECTED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_key" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(20) NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"feed_item_id" uuid,
	"wp_site_id" uuid,
	"source_url" text NOT NULL,
	"original_content" text NOT NULL,
	"generated_content" text NOT NULL,
	"title" text NOT NULL,
	"meta_title" varchar(255),
	"meta_description" text,
	"slug" varchar(255),
	"featured_image_url" text,
	"status" "article_status" DEFAULT 'DRAFT',
	"wp_post_id" varchar(50),
	"wp_post_url" text,
	"tokens_used" real DEFAULT 0,
	"seo_data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "category_mapping" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wp_site_id" uuid NOT NULL,
	"source_category" varchar(255) NOT NULL,
	"target_category_id" varchar(50) NOT NULL,
	"target_category_name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"polling_interval_minutes" integer DEFAULT 15,
	"auto_publish" boolean DEFAULT false,
	"default_wp_site_id" uuid,
	"status" "feed_status" DEFAULT 'ACTIVE',
	"last_polled_at" timestamp,
	"items_fetched" integer DEFAULT 0,
	"success_rate" real DEFAULT 100,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feed_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"feed_id" uuid NOT NULL,
	"guid" text NOT NULL,
	"title" text NOT NULL,
	"url" text NOT NULL,
	"content_preview" text,
	"status" "feed_item_status" DEFAULT 'PENDING',
	"published_at" timestamp,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feed_item_guid_unique" UNIQUE("guid")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan" "subscription_plan" NOT NULL,
	"stripe_subscription_id" varchar(255),
	"status" "subscription_status" DEFAULT 'ACTIVE',
	"tokens_per_month" integer NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"canceled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "token_balance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"balance" real DEFAULT 0,
	"total_purchased" real DEFAULT 0,
	"total_used" real DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_balance_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" real NOT NULL,
	"tokens" real NOT NULL,
	"stripe_payment_id" varchar(255),
	"status" "transaction_status" DEFAULT 'PENDING',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'USER',
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "view_boost_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"url" text NOT NULL,
	"target_views" integer NOT NULL,
	"current_views" integer DEFAULT 0,
	"status" "view_boost_status" DEFAULT 'pending',
	"proxy_list" text,
	"service_type" "view_boost_service_type" DEFAULT 'standard',
	"delay_min" integer DEFAULT 5,
	"delay_max" integer DEFAULT 30,
	"error_message" text,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wp_site" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"username" varchar(255) NOT NULL,
	"app_password_encrypted" text NOT NULL,
	"status" "wp_site_status" DEFAULT 'PENDING',
	"categories_cache" jsonb DEFAULT '[]'::jsonb,
	"last_health_check" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_feed_item_id_feed_item_id_fk" FOREIGN KEY ("feed_item_id") REFERENCES "public"."feed_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "article_wp_site_id_wp_site_id_fk" FOREIGN KEY ("wp_site_id") REFERENCES "public"."wp_site"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_mapping" ADD CONSTRAINT "category_mapping_wp_site_id_wp_site_id_fk" FOREIGN KEY ("wp_site_id") REFERENCES "public"."wp_site"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed" ADD CONSTRAINT "feed_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed" ADD CONSTRAINT "feed_default_wp_site_id_wp_site_id_fk" FOREIGN KEY ("default_wp_site_id") REFERENCES "public"."wp_site"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_item" ADD CONSTRAINT "feed_item_feed_id_feed_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_balance" ADD CONSTRAINT "token_balance_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "view_boost_jobs" ADD CONSTRAINT "view_boost_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wp_site" ADD CONSTRAINT "wp_site_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_wp_site_source_category" ON "category_mapping" USING btree ("wp_site_id","source_category");