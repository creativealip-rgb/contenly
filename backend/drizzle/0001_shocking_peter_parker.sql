CREATE TYPE "public"."feature_type" AS ENUM('ARTICLE_GENERATION', 'INSTAGRAM_GENERATION');--> statement-breakpoint
ALTER TYPE "public"."subscription_plan" ADD VALUE 'FREE' BEFORE 'FREE_TRIAL';--> statement-breakpoint
CREATE TABLE "daily_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"feature_type" "feature_type" NOT NULL,
	"count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "instagram_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"source_url" text,
	"source_content" text,
	"global_style" varchar(100),
	"font_family" varchar(100) DEFAULT 'Montserrat',
	"total_slides" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instagram_slide" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"slide_number" integer NOT NULL,
	"text_content" text NOT NULL,
	"visual_prompt" text,
	"image_url" text,
	"layout_position" varchar(50),
	"font_size" integer DEFAULT 24,
	"font_color" varchar(20) DEFAULT '#FFFFFF',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "script_project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(255) NOT NULL,
	"source_url" text,
	"source_content" text,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "script_scene" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"scene_number" integer NOT NULL,
	"visual_context" text NOT NULL,
	"voiceover_text" text NOT NULL,
	"estimated_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "style_preset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"prompt_template" text NOT NULL,
	"negative_prompt" text,
	"thumbnail_url" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "plan" SET DEFAULT 'FREE';--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "tokens_per_month" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "current_period_start" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "subscription" ALTER COLUMN "current_period_end" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_project" ADD CONSTRAINT "instagram_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instagram_slide" ADD CONSTRAINT "instagram_slide_project_id_instagram_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."instagram_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_project" ADD CONSTRAINT "script_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "script_scene" ADD CONSTRAINT "script_scene_project_id_script_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."script_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_daily_user_feature" ON "daily_usage" USING btree ("user_id","date","feature_type");