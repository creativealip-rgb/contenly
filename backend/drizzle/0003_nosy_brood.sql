CREATE TYPE "public"."render_job_status" AS ENUM('queued', 'processing', 'completed', 'failed', 'timeout');--> statement-breakpoint
ALTER TYPE "public"."feature_type" ADD VALUE 'VIDEO_GENERATION';--> statement-breakpoint
CREATE TABLE "brand_kit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"primary_color" varchar(20) DEFAULT '#000000',
	"secondary_color" varchar(20) DEFAULT '#ffffff',
	"accent_color" varchar(20) DEFAULT '#ff0000',
	"font_title" varchar(100) DEFAULT 'Inter',
	"font_body" varchar(100) DEFAULT 'Inter',
	"logo_url" text,
	"website" varchar(255),
	"description" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_id" uuid NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"views" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"engagement" integer DEFAULT 0,
	"platform" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "render_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" "render_job_status" DEFAULT 'queued' NOT NULL,
	"input" jsonb NOT NULL,
	"output_path" text,
	"output_format" varchar(10),
	"error" text,
	"progress" integer DEFAULT 0,
	"tokens_cost" integer DEFAULT 0,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"content_id" uuid,
	"title" varchar(255) NOT NULL,
	"scheduled_at" timestamp NOT NULL,
	"platform" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending',
	"published_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"platform" varchar(50) NOT NULL,
	"account_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"username" varchar(255),
	"profile_url" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'::text;--> statement-breakpoint
DROP TYPE "public"."user_role";--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin', 'super_admin');--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'user'::"public"."user_role";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DATA TYPE "public"."user_role" USING "role"::"public"."user_role";--> statement-breakpoint
ALTER TABLE "instagram_project" ADD COLUMN "template_id" varchar(100);--> statement-breakpoint
ALTER TABLE "instagram_slide" ADD COLUMN "gradient_colors" varchar(100);--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "headline" varchar(255);--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "sub_headline" varchar(255);--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "caption" text;--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "hook" text;--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "thumbnail_prompt" text;--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "music_suggestion" text;--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "hashtags" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "script_project" ADD COLUMN "target_duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "script_scene" ADD COLUMN "emoji" varchar(10);--> statement-breakpoint
ALTER TABLE "script_scene" ADD COLUMN "footage_searches" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "script_scene" ADD COLUMN "broll_prompt" text;--> statement-breakpoint
ALTER TABLE "script_scene" ADD COLUMN "selected_footage" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "brand_kit" ADD CONSTRAINT "brand_kit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_analytics" ADD CONSTRAINT "content_analytics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "render_jobs" ADD CONSTRAINT "render_jobs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_content" ADD CONSTRAINT "scheduled_content_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_account" ADD CONSTRAINT "social_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_content_date" ON "content_analytics" USING btree ("content_id","date");--> statement-breakpoint
CREATE INDEX "article_user_id_idx" ON "article" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "article_status_idx" ON "article" USING btree ("status");--> statement-breakpoint
CREATE INDEX "article_created_at_idx" ON "article" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notification_user_id_idx" ON "notification" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_created_at_idx" ON "notification" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "script_project_user_id_idx" ON "script_project" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "script_project_created_at_idx" ON "script_project" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "script_scene_project_id_idx" ON "script_scene" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "transaction_user_id_idx" ON "transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transaction_created_at_idx" ON "transaction" USING btree ("created_at");